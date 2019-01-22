"use strict";

const Config = require("eslint/lib/config")
  , Linter = require("eslint/lib/linter")
  , merge = require("eslint/lib/config/config-ops").merge;

const blocklistedSettings = [
  "import/resolver"
];

function filterSettings(settings) {
  let report = [];

  for (const name of blocklistedSettings) {
    if (Reflect.has(settings, name)) {
      delete settings[name];
      report.push(`* ${name}`);
    }
  }
  return report;
}

class SettingBlocklist {
  constructor() {
    this._report = [];
  }

  filter(originalConfig) {
    if (typeof originalConfig === "undefined" || originalConfig === null) {
      return {};
    }

    let config = merge({}, originalConfig);

    this._report = [];

    if (Reflect.has(config, "settings")) {
      let report = filterSettings(config.settings);
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

      const blocklist = new SettingBlocklist();
      const config = new Config({
        configFile: configFile,
        cwd: process.cwd()
      },
      new Linter());
      blocklist.filter(config.specificConfig);

      if (report.length > 0 || blocklist.report.length > 0) {
        report = report.concat(blocklist.report);
      }

      return report;
    }).filter(function(report) { return report.length > 0; });

    if (reports.length === 0) {
      return [];
    } else {
      return [["Ignoring the following settings that rely on module resolution:"]]
        .concat(reports)
        .reduce(function(a, b) { return a.concat([""]).concat(b); });
    }
  }
}

module.exports = SettingBlocklist;
