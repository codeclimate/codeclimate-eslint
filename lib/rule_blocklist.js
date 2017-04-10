"use strict";

const Config = require("eslint/lib/config")
  , merge = require("eslint/lib/config/config-ops").merge;

const blocklistedRules = [
  "import/no-restricted-paths",
  "import/no-unresolved",
  "node/no-hide-code-modules"
];

function filterRules(rules) {
  let report = [];

  for (const name of blocklistedRules) {
    if (Reflect.has(rules, name)) {
      let config = rules[name];
      if (config.constructor !== Array) {
        config = [config];
      }
      let severity = config.shift();

      if (severity !== 0 && !(typeof severity === "string" && severity.toLowerCase() === "off")) {
        rules[name] = "off";
        report.push(`* ${name}`);
      }
    }
  }
  return report;
}

class RuleBlocklist {
  constructor() {
    this._report = [];
  }

  filter(originalConfig) {
    if (typeof originalConfig === "undefined" || originalConfig === null) {
      return {};
    }

    let config = merge({}, originalConfig);

    this._report = [];

    if (Reflect.has(config, "rules")) {
      let report = filterRules(config.rules);
      this._report = this._report.concat(report);
    }

    return config;
  }

  get report() {
    return [].concat(this._report);
  }

  static report(configs) {
    const reports = configs.map(function(configFile) {
      let report = [];

      const blocklist = new RuleBlocklist();
      const config = new Config({
        configFile: configFile,
        cwd: process.cwd()
      });
      blocklist.filter(config.useSpecificConfig);

      if (report.length > 0 || blocklist.report.length > 0) {
        report = report.concat(blocklist.report);
      }

      return report;
    });

    if (reports.length === 0) {
      return [];
    } else {
      return [["Ignoring the following rules that rely on module resolution:"]]
        .concat(reports)
        .reduce(function(a, b) { return a.concat([""]).concat(b); });
    }
  }
}

module.exports = RuleBlocklist;
