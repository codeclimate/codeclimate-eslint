#!/usr/bin/env node

var CLIEngine = require("eslint").CLIEngine;
var fs = require("fs");

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
    }
  };
  return JSON.stringify(issue);
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

var cli = new CLIEngine(options);
var report = cli.executeOnFiles(["/code"]);
report.results.forEach(function(result) {
  var path = result.filePath.replace(/^\/code\//, "");
  if (ignores.indexOf(path) === -1) {
    result.messages.forEach(function(message) {
      var issueJson = buildIssueJson(message, path);
      console.log(issueJson + "\u0000");
    });
  }
});
