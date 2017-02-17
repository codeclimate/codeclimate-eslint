#!/usr/src/app/bin/node_gc

var CODE_DIR = "/code";
process.chdir(CODE_DIR);

// Redirect `console.log` so that we are the only ones
// writing to STDOUT
var stdout = console.log;
console.log = console.error;

var eslint = require('../lib/eslint-patch')(require('eslint'));

var BatchSanitizer = require("../lib/batch_sanitizer");
var CLIEngine = eslint.CLIEngine;
var docs = eslint.docs;
var fs = require("fs");
var glob = require("glob");
var options = { extensions: [".js"], ignore: true, reset: false, useEslintrc: true };
var cli; // instantiation delayed until after options are (potentially) modified
var debug = false;
var ignoreWarnings = false;
var ESLINT_WARNING_SEVERITY = 1;
var checks = require("../lib/checks");
var validateConfig = require("../lib/validate_config");
var computeFingerprint = require("../lib/compute_fingerprint");
const ConfigUpgrader = require("../lib/config_upgrader");

// a wrapper for emitting perf timing
function runWithTiming(name, fn) {
  var start = new Date()
    , rv = fn()
    , duration = (new Date() - start) / 1000;
  if (debug) {
    console.error("eslint.timing." + name + ": " + duration + "s");
  }
  return rv;
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
  var ignored = cli.isPathIgnored(file);
  if (ignored) {
    var output = "File `" + file + "` ignored because of your .eslintignore file." + "\n";
    process.stderr.write(output);
  }
  return ignored;
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

var buildFileList;
runWithTiming("engineConfig", function () {
  if (fs.existsSync("/config.json")) {
    var engineConfig = JSON.parse(fs.readFileSync("/config.json"));

    if (engineConfig.include_paths) {
      buildFileList = inclusionBasedFileListBuilder(
        engineConfig.include_paths
      );
    } else {
      // No explicit includes, let's try with everything
      buildFileList = inclusionBasedFileListBuilder(["./"]);
    }

    var userConfig = engineConfig.config || {};
    if (userConfig.config) {
      options.configFile = CODE_DIR + "/" + userConfig.config;
      options.useEslintrc = false;
    }

    if (userConfig.extensions) {
      options.extensions = userConfig.extensions;
    }

    if (userConfig.ignore_path) {
      options.ignorePath = userConfig.ignore_path;
    }

    if (userConfig.ignore_warnings) {
      ignoreWarnings = true;
    }

    if (userConfig.debug) {
      debug = true;
    }
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
      process.stderr.write("Analyzing: " + batchFiles + "\n");
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
          process.stdout.write(issueJson + "\u0000\n");
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
  console.error("ESLint is running with the " + cli.getConfigForFile(null).parser + " parser.");

  for (const line of ConfigUpgrader.upgradeInstructions(analysisFiles, process.cwd())) {
    console.error(line);
  }

  analyzeFiles();
} else {
  console.error("No rules are configured. Make sure you have added a config file with rules enabled.");
  console.error("See our documentation at https://docs.codeclimate.com/docs/eslint for more information.");
  process.exit(1);
}
