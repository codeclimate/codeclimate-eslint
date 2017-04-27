#!/usr/src/app/bin/node_gc

const fs = require("fs");
const glob = require("glob");

const eslint = require('./eslint-patch')();
const docs = require('./docs')();
const BatchSanitizer = require("./batch_sanitizer");
const EngineConfig = require("./engine_config");
const checks = require("./checks");
const validateConfig = require("./validate_config");
const computeFingerprint = require("./compute_fingerprint");
const ConfigUpgrader = require("./config_upgrader");
const RuleBlocklist = require("./rule_blocklist");
const findConfigs = require("./config_finder");

const CLIEngine = eslint.CLIEngine;
const options = { extensions: [".js"], ignore: true, reset: false, useEslintrc: true };

function run(console, runOptions) {
  const STDOUT = console.log;
  console.log = console.error;

  var configPath = runOptions.configPath || "/config.json";
  var codeDir = runOptions.dir || "/code";

  var cli; // instantiation delayed until after options are (potentially) modified
  var debug = false;
  var ignoreWarnings = false;
  var ESLINT_WARNING_SEVERITY = 1;

  // a wrapper for emitting perf timing
  function runWithTiming(name, fn) {
    const start = new Date();
    const result = fn();

    if (debug) {
      const duration = (new Date() - start) / 1000;
      console.error("eslint.timing." + name + ": " + duration + "s");
    }

    return result;
  }

  function contentBody(check) {
    var content = docs.get(check) || "For more information visit ";
    return content + "Source: http://eslint.org/docs/rules/\n";
  }

  function buildIssueJson(message, path) {
    // ESLint doesn't emit a ruleId in the
    // case of a fatal error (such as an invalid
    // token)
    var checkName = message.ruleId;
    if(message.fatal) {
      checkName = "fatal";
    }
    var line = message.line || 1;
    var column = message.column || 1;

    var issue = {
      type: "issue",
      categories: checks.categories(checkName),
      check_name: checkName,
      description: message.message,
      content: {
        body: contentBody(checkName)
      },
      location: {
        path: path,
        positions: {
          begin: {
            line: line,
            column: column
          },
          end: {
            line: line,
            column: column
          }
        }
      },
      remediation_points: checks.remediationPoints(checkName, message, cli.getConfigForFile(path))
    };

    var fingerprint = computeFingerprint(path, checkName, message.message);

    if (fingerprint) {
      issue["fingerprint"] = fingerprint;
    }

    return JSON.stringify(issue);
  }

  function isFileWithMatchingExtension(file, extensions) {
    var stats = fs.lstatSync(file);
    var extension = "." + file.split(".").pop();
    return (
      stats.isFile() &&
      !stats.isSymbolicLink()
      && extensions.indexOf(extension) >= 0
    );
  }

  function isFileIgnoredByLibrary(file) {
    return cli.isPathIgnored(file);
  }

  function prunePathsWithinSymlinks(paths) {
    // Extracts symlinked paths and filters them out, including any child paths
    var symlinks = paths.filter(function(path) {
      return fs.lstatSync(path).isSymbolicLink();
    });

    return paths.filter(function(path) {
      var withinSymlink = false;
      symlinks.forEach(function(symlink) {
        if (path.indexOf(symlink) === 0) {
          withinSymlink = true;
        }
      });
      return !withinSymlink;
    });
  }

  function inclusionBasedFileListBuilder(includePaths) {
    // Uses glob to expand the files and directories in includePaths, filtering
    // down to match the list of desired extensions.
    return function(extensions) {
      var analysisFiles = [];

      includePaths.forEach(function(fileOrDirectory, i) {
        if ((/\/$/).test(fileOrDirectory)) {
          // if it ends in a slash, expand and push
          var filesInThisDirectory = glob.sync(
            fileOrDirectory + "/**/**"
          );
          prunePathsWithinSymlinks(filesInThisDirectory).forEach(function(file, j){
            if (!isFileIgnoredByLibrary(file) && isFileWithMatchingExtension(file, extensions)) {
              analysisFiles.push(file);
            }
          });
        } else {
          if (!isFileIgnoredByLibrary(fileOrDirectory) && isFileWithMatchingExtension(fileOrDirectory, extensions)) {
            analysisFiles.push(fileOrDirectory);
          }
        }
      });

      return analysisFiles;
    };
  }

  function overrideOptions(userConfig) {
    if (userConfig.configPath()) {
      options.configFile = codeDir + "/" + userConfig.configPath();
      options.useEslintrc = false;
    }

    if (userConfig.extensions()) {
      options.extensions = userConfig.extensions();
    }

    if (userConfig.ignorePath()) {
      options.ignorePath = userConfig.ignorePath();
    }

    ignoreWarnings = userConfig.ignoreWarnings();
    debug = userConfig.debug();
  }

  // No explicit includes, let's try with everything
  var buildFileList = inclusionBasedFileListBuilder(["./"]);

  runWithTiming("engineConfig", function () {
    if (fs.existsSync(configPath)) {
      var engineConfig = new EngineConfig(configPath);

      if (engineConfig.includePaths()) {
        buildFileList = inclusionBasedFileListBuilder(engineConfig.includePaths());
      }

      overrideOptions(engineConfig.userConfig());
    }

    cli = new CLIEngine(options);
  });

  var analysisFiles = runWithTiming("buildFileList", function() {
    return buildFileList(options.extensions);
  });

  function analyzeFiles() {
    var batchNum = 0
      , batchSize = 10
      , batchFiles
      , batchReport
      , sanitizedBatchFiles;

    while(analysisFiles.length > 0) {
      batchFiles = analysisFiles.splice(0, batchSize);
      sanitizedBatchFiles = (new BatchSanitizer(batchFiles)).sanitizedFiles();

      if (debug) {
        console.error("Analyzing: " + batchFiles);
      }

      runWithTiming("analyze-batch-" + batchNum, function() {
        batchReport = cli.executeOnFiles(sanitizedBatchFiles);
      });
      runWithTiming("report-batch" + batchNum, function() {
        batchReport.results.forEach(function(result) {
          var path = result.filePath.replace(/^\/code\//, "");

          result.messages.forEach(function(message) {
            if (ignoreWarnings && message.severity === ESLINT_WARNING_SEVERITY) { return; }

            var issueJson = buildIssueJson(message, path);
            STDOUT(issueJson + "\u0000\n");
          });
        });
      });
      runWithTiming("gc-batch-" + batchNum, function() {
        batchFiles = null;
        batchReport = null;
        global.gc();
      });

      batchNum++;
    }
  }

  if (validateConfig(options.configFile)) {
    console.error("ESLint is running with the " + (cli.getConfigForFile(null).parser || "default") + " parser.");


    let configs = findConfigs(options.configFile, analysisFiles);

    let report = [
      ConfigUpgrader.upgradeInstructions(configs, process.cwd()),
      RuleBlocklist.report(configs)
    ].reduce(function(a, b) { return a.concat([""]).concat(b); });

    for (const line of report) {
      console.error(line);
    }

    analyzeFiles();
  } else {
    console.error("No rules are configured. Make sure you have added a config file with rules enabled.");
    console.error("See our documentation at https://docs.codeclimate.com/docs/eslint for more information.");
  }
}

module.exports = { run };
