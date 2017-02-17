"use strict";

const Config = require("eslint/lib/config")
  , merge = require("eslint/lib/config/config-ops").merge
  , path = require("path")
  , stringify = require("json-stable-stringify")
  , CONFIG_FILES = require("eslint/lib/config/config-file").CONFIG_FILES
  , FileFinder = require("eslint/lib/file-finder");

var SEVERITIES = {
  0: "off",
  1: "warn",
  2: "error"
};

var ES6Features = [
  "arrowFunctions", "binaryLiterals", "blockBindings", "classes",
  "defaultParams", "destructuring", "forOf", "generators", "modules",
  "objectLiteralComputedProperties", "objectLiteralDuplicateProperties",
  "objectLiteralShorthandMethods", "objectLiteralShorthandProperties",
  "octalLiterals", "regexUFlag", "regexYFlag", "restParams", "spread",
  "superInFunctions", "templateStrings", "unicodeCodePointEscapes"
];

function upgradeEcmaFeatures(config) {
  let report = [];
  if (Reflect.has(config, "ecmaFeatures")) {
    let parserOptions = {};
    if (!Reflect.has(config, "parserOptions")) {
      config["parserOptions"] = parserOptions;
    };
    const features = config.ecmaFeatures;
    let es = 5;

    if (features["modules"] === true) {
      parserOptions["sourceType"] = "module";
      report.push(`* Set sourceType to "module" in parserOptions section`);
    }

    for (const feature of ES6Features) {
      if (Reflect.has(features, feature)) {
        if (features[feature] === true) {
          es = 6;
        }
        delete features[feature];
        report.push(`* Remove ${feature} from ecmaFeatures section`);
      }
    }

    parserOptions.ecmaVersion = Math.max(es, parserOptions.ecmaVersion || 0);
    if (parserOptions.ecmaVersion !== 5) {
      report.push(`* Set ecmaVersion to ${parserOptions.ecmaVersion} in parserOptions section`);
    }

    if (Object.keys(features).length) {
      parserOptions["ecmaFeatures"] = features;
      delete config["ecmaFeatures"];
      report.push("* Move ecmaFeatures section under parserOptions section");
    }

    delete config["ecmaFeatures"];
  }
  return report;
}

const removedRules = {
  "generator-star":
    function(severity, pos) {
      var pos = pos || "";
      var config = {
        before: pos === "middle" || pos === "end",
        after: pos === "begin" || pos === "middle"
      };

      return {"generator-star-spacing": [severity, config]};
    },
  "global-strict":
    function(severity, option) {
      if (option === "always") {
        var config = {"global": true};
        return {"strict": [severity, config]};
      } else {
        return {"strict": severity};
      };
    },
  "no-arrow-condition":
    function(severity, option) {
      return {
        "no-confusing-arrow": severity,
        "no-constant-condition": [severity, {"checkLoops": false}]
      };
    },
  "no-comma-dangle":
    function(severity) {
      return {"comma-dangle": [severity, "always-multiline"]};
    },
  "no-empty-class":
    function(severity) {
      return {"no-empty-character-class": severity};
    },
  "no-empty-label":
    function(severity) {
      return {"no-labels": [severity, {"allowLoop": true}]};
    },
  "no-extra-strict":
    function(severity) {
      return {"strict": [severity, {"global": true}]};
    },
  "no-reserved-keys":
    function(severity) {
      return {"quote-props": [severity, "as-needed", {"keywords": true}]};
    },
  "no-space-before-semi":
    function(severity) {
      return {"semi-spacing": [severity, {"before": false}]};
    },
  "no-wrap-func":
    function(severity) {
      return {"no-extra-parens": [severity, "functions"]};
    },
  "space-after-function-name":
    function(severity, option) {
      return {"space-before-function-paren": [severity, option]};
    },
  "space-after-keywords":
    function(severity, option) {
      return {
        "keyword-spacing": [
          severity,
          {
            "after": option === "always"
          }
        ]};
    },
  "space-before-function-parentheses":
    function(severity, options) {
      return {"space-before-function-paren": [severity, options]};
    },
  "space-before-keywords":
    function(severity, option) {
      var config = {
        "before": option === "always"
      };

      return {"keyword-spacing": [severity, config]};
    },
  "space-in-brackets":
    function(severity, option) {
      return {
        "object-curly-spacing": [severity, option],
        "array-bracket-spacing": [severity, option]
      };
    },
  "space-return-throw-case":
    function(severity) {
      return {"keyword-spacing": [severity, {"after": true}]};
    },
  "space-unary-word-ops":
    function(severity) {
      return {"space-unary-ops": [severity, {"words": true}]};
    },
  "spaced-line-comment":
    function(severity, options) {
      return {"spaced-comment": [severity].concat(options)};
    }
};

function upgradeRules(rules) {
  let report = [];
  for (const oldName in removedRules) {
    if (Reflect.has(rules, oldName)) {
      let config = rules[oldName];
      if (config.constructor !== Array) {
        config = [config];
      }
      let severity = config.shift();
      severity = SEVERITIES[severity] || severity;
      if (config.length === 1) {
        config = config[0];
      }
      let newRules = removedRules[oldName](severity, config);
      delete rules[oldName];
      for (const rule in newRules) {
        rules[rule] = newRules[rule];
      }

      report.push(
        `* Remove ${oldName} rule and add the following:\n` +
        stringify(newRules, { space: 4 }).replace(/^[{}]$/gm, "") +
        "\n"
      );
    }
  }
  return report;
}

function relativePath(filePath, root) {
  return filePath.replace(new RegExp(`^${root}/`), '');
}

class ConfigUpgrader {
  constructor() {
    this._report = [];
  };

  upgrade(originalConfig) {
    let config = merge({}, originalConfig);

    this._report = [];

    let report = upgradeEcmaFeatures(config);
    this._report = this._report.concat(report);
    if (Reflect.has(config, "rules")) {
      report = upgradeRules(config.rules);
      this._report = this._report.concat(report);
    }

    return config;
  }

  get report() {
    return [].concat(this._report);
  }

  static configs(analysisFiles) {
    const dirs = analysisFiles.map(function(fileName){
      return path.dirname(fileName);
    });
    const directories = Array.from(new Set(dirs));

    const localConfigFinder = new FileFinder(CONFIG_FILES, process.cwd());

    const configs = new Set();
    for (const dir of directories) {
      const configFiles = localConfigFinder.findAllInDirectoryAndParents(dir);
      for (const file of configFiles) {
        configs.add(file);
      }
    }

    return Array.from(configs);
  }

  static upgradeInstructions(analysisFiles, root) {
    const reports = this.configs(analysisFiles).map(function(configFile) {
      let report = [];

      const upgrader = new ConfigUpgrader();
      const config = new Config({configFile: configFile});
      upgrader.upgrade(config.useSpecificConfig);

      if (path.extname(configFile) === '') {
        report.push("* Add .yml or .json to the config file name. Extension-less config file names are deprecated.");
      }

      const bareConfigFilePath = relativePath(configFile, root);

      if (report.length > 0 || upgrader.report.length > 0) {
        report = [
          `${bareConfigFilePath} appears to be incompatible with ESLint 3.`,
          "To upgrade it do the following:\n"
        ].concat(report).concat(upgrader.report);
      }

      return report;
    });

    return reports.reduce(function(a, b) { return a.concat([""]).concat(b); });
  }
}

module.exports = ConfigUpgrader;
