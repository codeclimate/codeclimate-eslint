#!/usr/src/app/bin/node_gc

process.chdir('/code');

// Redirect `console.log` so that we are the only ones
// writing to STDOUT
var stdout = console.log;
console.log = console.error;

var CLIEngine = require("eslint").CLIEngine;
var docs = require("eslint").docs;
var fs = require("fs");
var glob = require("glob");
var options = { extensions: [".js"], ignore: true, reset: false, useEslintrc: true };
var cli = new CLIEngine(options);
var debug = false;
var checks = require("../lib/checks");

// a wrapper for emitting perf timing
function runWithTiming(name, fn) {
  var start = new Date()
    , rv = fn()
    , duration = (new Date() - start) / 1000;
  console.error("eslint.timing." + name + ": " + duration + "s");
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
          line: message.line,
          column: message.column
        },
        end: {
          line: message.line,
          column: message.column
        }
      }
    },
    remediation_points: checks.remediationPoints(checkName, message)
  };
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
  var path = file.replace(/^\/code\//, "");
  var ignored = cli.isPathIgnored(path);
  if (ignored) {
    var output = "File `" + path + "` ignored because of your .eslintignore file." + "\n";
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

function exclusionBasedFileListBuilder(excludePaths) {
  // Uses glob to traverse code directory and find files to analyze,
  // excluding files passed in with by CLI config, and including only
  // files in the list of desired extensions.
  //
  // Deprecated style of file expansion, supported for users of the old CLI.
  return function(extensions) {
    var analysisFiles = [];
    var allFiles = glob.sync("/code/**/**", {});

    prunePathsWithinSymlinks(allFiles).forEach(function(file, i, a){
      if(excludePaths.indexOf(file.split("/code/")[1]) < 0) {
        if(fs.lstatSync(file).isFile()) {
          if (!isFileIgnoredByLibrary(file) && isFileWithMatchingExtension(file, extensions)) {
            analysisFiles.push(file);
          }
        }
      }
    });

    return analysisFiles;
  };
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
          "/code/" + fileOrDirectory + "/**/**"
        );
        prunePathsWithinSymlinks(filesInThisDirectory).forEach(function(file, j){
          if (!isFileIgnoredByLibrary(file) && isFileWithMatchingExtension(file, extensions)) {
            analysisFiles.push(file);
          }
        });
      } else {
        // if not, check for ending in *.js
        var fullPath = "/code/" + fileOrDirectory;
        if (!isFileIgnoredByLibrary(fullPath) && isFileWithMatchingExtension(fullPath, extensions)) {
          analysisFiles.push(fullPath);
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
    } else if (engineConfig.exclude_paths) {
      var ignores = engineConfig.exclude_paths;
      buildFileList = exclusionBasedFileListBuilder(ignores);
    } else {
      // No includes or excludes, let's try with everything
      buildFileList = exclusionBasedFileListBuilder([]);
    }

    var userConfig = engineConfig.config || {};
    if (userConfig.config) {
      options.configFile = "/code/" + userConfig.config;
    }

    if (userConfig.extensions) {
      options.extensions = userConfig.extensions;
    }

    if (userConfig.debug) {
      debug = true;
    }
  }
});

var analysisFiles = runWithTiming("buildFileList", function() {
  return buildFileList(options.extensions);
});

function analyzeFiles() {
  var batchNum = 0
    , batchSize = 10
    , batchFiles
    , batchReport;

  while(analysisFiles.length > 0) {
    batchFiles = analysisFiles.splice(0, batchSize);

    if (debug) {
      process.stderr.write("Analyzing: " + batchFiles + "\n");
    }

    runWithTiming("analyze-batch-" + batchNum, function() {
       batchReport = cli.executeOnFiles(batchFiles);
    });
    runWithTiming("report-batch" + batchNum, function() {
      batchReport.results.forEach(function(result) {
        var path = result.filePath.replace(/^\/code\//, "");

        result.messages.forEach(function(message) {
          var issueJson = buildIssueJson(message, path);
          process.stdout.write(issueJson + "\u0000");
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

analyzeFiles();
