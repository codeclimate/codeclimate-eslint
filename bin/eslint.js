#!/usr/bin/env node

var CLIEngine = require("eslint").CLIEngine;
var fs = require("fs");
var glob = require("glob");

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

// Uses glob to traverse code directory and find files to analyze,
// excluding files passed in with by CLI config, and including only
// files in the list of desired extensions
function fileWalk(excludePaths, extensions){
  var analysisFiles = [];
  var allFiles = glob.sync("/code/**/**", {});

  allFiles.forEach(function(file, i, a){
    if(excludePaths.indexOf(file.split("/code/")[1]) < 0) {
      if(!fs.lstatSync(file).isDirectory()) {
        var extension = "." + file.split(".").pop();

        if(extensions.indexOf(extension) >= 0) {
          analysisFiles.push(file);
        }
      }
    }
  });

  return analysisFiles;
}

var options = {
  extensions: [".js"], ignore: true, reset: false, useEslintrc: true
};
var ignores = [];

if (fs.existsSync("/config.json")) {
  var engineConfig = JSON.parse(fs.readFileSync("/config.json"));

  if (engineConfig.config) {
    options.configFile = "/code/" + engineConfig.config;
  }

  if (engineConfig.exclude_paths) {
    ignores = engineConfig.exclude_paths;
  }

  if (engineConfig.extensions) {
    options.extensions = engineConfig.extensions;
  }
}

var analysisFiles = fileWalk(ignores, options.extensions),
    cli = new CLIEngine(options),
    report = cli.executeOnFiles(analysisFiles);

report.results.forEach(function(result) {
  var path = result.filePath.replace(/^\/code\//, "");

  result.messages.forEach(function(message) {
    var issueJson = buildIssueJson(message, path);
    console.log(issueJson + "\u0000");
  });
});
