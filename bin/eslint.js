#!/usr/bin/env node

var CLIEngine = require("eslint").CLIEngine;
var fs = require("fs");
var glob = require("glob");

// a wrapper for emitting perf timing
function runWithTiming(name, fn) {
  var start = new Date(),
      rv = fn(),
      duration = (new Date() - start) / 1000;
  console.error("eslint.timing." + name + ": " + duration + "s");
  return rv;
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
    categories: ["Style"],
    check_name: checkName,
    description: message.message,
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
    remediation_points: 50000
  };
  return JSON.stringify(issue);
}

function isFileWithMatchingExtension(file, extensions) {
  var extension = "." + file.split(".").pop();
  return (extensions.indexOf(extension) >= 0);
}

// Uses glob to traverse code directory and find files to analyze,
// excluding files passed in with by CLI config, and including only
// files in the list of desired extensions
function fileWalk(includePaths, extensions){
  var analysisFiles = [];

  includePaths.forEach(function(fileOrDirectory, i) {
    if ((/\/$/).test(fileOrDirectory)) {
      // if it ends in a slash, expand and push
      var filesInThisDirectory = glob.sync(
        "/code/" + fileOrDirectory + "/**/**"
      );
      filesInThisDirectory.forEach(function(file, j){
        if(!fs.lstatSync(file).isDirectory()) {
          if (isFileWithMatchingExtension(file, extensions)) {
            analysisFiles.push(file);
          }
        }
      });
    } else {
      // if not, check for ending in *.js
      if (isFileWithMatchingExtension(fileOrDirectory, extensions)) {
        analysisFiles.push("/code/" + fileOrDirectory);
      }
    }
  });

  return analysisFiles;
}

var options = {
  extensions: [".js"], ignore: true, reset: false, useEslintrc: true
};
var includePaths = [];

runWithTiming("engineConfig", function () {
  if (fs.existsSync("/config.json")) {
    var engineConfig = JSON.parse(fs.readFileSync("/config.json"));

    if (engineConfig.config) {
      options.configFile = "/code/" + engineConfig.config;
    }

    includePaths = engineConfig.include_paths;

    if (engineConfig.extensions) {
      options.extensions = engineConfig.extensions;
    }
  }
});

var analysisFiles = runWithTiming("fileWalk", function() { return fileWalk(includePaths, options.extensions); }),
    cli = runWithTiming("cliInit", function() { return new CLIEngine(options); }),
    report = runWithTiming("cliRun", function() { return cli.executeOnFiles(analysisFiles); });

runWithTiming("resultsOutput",
  function() {
    report.results.forEach(function(result) {
      var path = result.filePath.replace(/^\/code\//, "");

      result.messages.forEach(function(message) {
        var issueJson = buildIssueJson(message, path);
        console.log(issueJson + "\u0000");
      });
    });
  }
);
