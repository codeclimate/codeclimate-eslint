const ConfigUpgrader = require("../lib/config_upgrader")
  , expect = require("chai").expect
  , fs = require("fs")
  , path = require("path")
  , stringify = require("json-stable-stringify")
  , temp = require('temp');

describe("ConfigUpgrader", function() {
  describe(".upgradeInstructions", function() {
    it("returns instructions", function(done) {
      temp.mkdir("code ", function(err, directory) {
        if (err) { throw err; }

        process.chdir(directory);

        const configPath = path.join(directory, ".eslintrc");
        fs.writeFile(configPath, "{}", function(err) {
          if (err) { throw err; }


          let report = ConfigUpgrader
            .upgradeInstructions([directory + '/file.js'], directory);
          expect(report).to.deep.eq([
            ".eslintrc appears to be incompatible with ESLint 3.",
            "To upgrade it do the following:\n",
            "* Add .yml or .json to the config file name. Extension-less config file names are deprecated."
          ]);
          done();
        });
      });
    });

    it("ignores irrelevant configs", function(done) {
      temp.mkdir("code ", function(err, directory) {
        if (err) { throw err; }

        process.chdir(directory);

        const configPath = path.join(directory, ".eslintrc.json");
        fs.writeFile(configPath, "{}", function(err) {
          if (err) { throw err; }

          fs.mkdir(path.join(directory, "lib"), function(err) {
            if (err) { throw err; }

            fs.writeFile(path.join(directory, "lib", ".eslintrc"), "{}", function(err) {
              if (err) { throw err; }

              let report = ConfigUpgrader
                .upgradeInstructions([directory + '/file.js'], directory);
              expect(report).to.deep.eq([]);
              done();
            });
          });
        });
      });
    });
  });


  describe("#upgrade", function() {
    describe("ecmaFeatures", function() {
      [
        "arrowFunctions", "binaryLiterals", "blockBindings", "classes",
        "defaultParams", "destructuring", "forOf", "generators",
        "objectLiteralComputedProperties", "objectLiteralDuplicateProperties",
        "objectLiteralShorthandMethods", "objectLiteralShorthandProperties",
        "octalLiterals", "regexUFlag", "regexYFlag", "restParams", "spread",
        "superInFunctions", "templateStrings", "unicodeCodePointEscapes"
      ].forEach(function(feature){
        let originalConfig = {ecmaFeatures: {}};
        originalConfig.ecmaFeatures[feature] = true;

        let convertedConfig = {parserOptions: {ecmaVersion: 6}};

        it(`upgrades ${stringify(originalConfig)}`, function(done){
          let upgrader = new ConfigUpgrader();
          let actualConfig = upgrader.upgrade(originalConfig);

          expect(actualConfig).to.deep.eq(convertedConfig);
          expect(upgrader.report).to.lengthOf(2);
          done();
        });
      });



      let originalConfig = {ecmaFeatures: {modules: true}};
      it(`upgrades ${stringify(originalConfig)}`, function(done){
        let convertedConfig = {parserOptions: {sourceType: "module", ecmaVersion: 6}};
        let upgrader = new ConfigUpgrader();
        let actualConfig = upgrader.upgrade(originalConfig);

        expect(actualConfig).to.deep.eq(convertedConfig);
        expect(upgrader.report).to.lengthOf(3);
        done();
      });

      it("carries over extra features", function(done) {
      let originalConfig = {ecmaFeatures: {extraFeature: "yep"}};
        let convertedConfig = {parserOptions: {ecmaFeatures: {extraFeature: "yep"}, ecmaVersion: 5}};
        let upgrader = new ConfigUpgrader();
        let actualConfig = upgrader.upgrade(originalConfig);

        expect(actualConfig).to.deep.eq(convertedConfig);
        expect(upgrader.report).to.lengthOf(1);
        done();
      });
    });

    describe("rules", function() {
      [
        [
          {rules: {"generator-star": [0, "begin"]}},
          {rules: {"generator-star-spacing": ["off", {before: false, after: true}]}}
        ],
        [
          {rules: {"generator-star": [1, "middle"]}},
          {rules: {"generator-star-spacing": ["warn", {before: true, after: true}]}}
        ],
        [
          {rules: {"generator-star": [2, "end"]}},
          {rules: {"generator-star-spacing": ["error", {before: true, after: false}]}}
        ],
        [
          {rules: {"global-strict": [2, "always"]}},
          {rules: {"strict": ["error", {global: true}]}}
        ],
        [
          {rules: {"global-strict": [2, "never"]}},
          {rules: {"strict": "error"}}
        ],
        [
          {rules: {"no-arrow-condition": [2, "never"]}},
          {rules: {"no-confusing-arrow": "error", "no-constant-condition": ["error", {"checkLoops": false}]}}
        ],
        [
          {rules: {"no-comma-dangle": 2}},
          {rules: {"comma-dangle": ["error", "always-multiline"]}}
        ],
        [
          {rules: {"no-empty-class": 2}},
          {rules: {"no-empty-character-class": "error"}}
        ],
        [
          {rules: {"no-empty-label": 2}},
          {rules: {"no-labels": ["error", {"allowLoop": true}]}}
        ],
        [
          {rules: {"no-extra-strict": 2}},
          {rules: {"strict": ["error", {"global": true}]}}
        ],
        [
          {rules: {"no-reserved-keys": 2}},
          {rules: { "quote-props": ["error", "as-needed", { "keywords": true }] }}
        ],
        [
          {rules: {"no-space-before-semi": 2}},
          {rules: { "semi-spacing": ["error", {"before": false}] }}
        ],
        [
          {rules: {"no-wrap-func": 2}},
          {rules: { "no-extra-parens": ["error", "functions"] }}
        ],
        [
          {rules: {"space-after-function-name": [2, "always"]}},
          {rules: {"space-before-function-paren": ["error", "always"]}}
        ],
        [
          {rules: {"space-after-function-name": [2, "never"]}},
          {rules: {"space-before-function-paren": ["error", "never"]}}
        ],
        [
          {rules: {"space-after-keywords": [2, "always"]}},
          {rules: {"keyword-spacing": ["error", {"after": true}]}}
        ],
        [
          {rules: {"space-after-keywords": [2, "never"]}},
          {rules: {"keyword-spacing": ["error", {"after": false}]}}
        ],
        [
          {rules: {"space-before-function-parentheses": [2, "options"]}},
          {rules: { "space-before-function-paren": ["error", "options"] }}
        ],
        [
          {rules: {"space-before-keywords": [2, "always"]}},
          {rules: {"keyword-spacing": ["error", {before: true}]}}
        ],
        [
          {rules: {"space-before-keywords": [2, "never"]}},
          {rules: {"keyword-spacing": ["error", {before: false}]}}
        ],
        [
          {rules: {"space-in-brackets": [2, "always"]}},
          {rules: {"object-curly-spacing": ["error", "always"], "array-bracket-spacing": ["error", "always"]}}
        ],
        [
          {rules: {"space-in-brackets": [2, "never"]}},
          {rules: {"object-curly-spacing": ["error", "never"], "array-bracket-spacing": ["error", "never"]}}
        ],
        [
          {rules: {"space-return-throw-case": 2}},
          {rules: {"keyword-spacing": ["error", {"after": true}]}}
        ],
        [
          {rules: {"space-unary-word-ops": 2}},
          {rules: {"space-unary-ops": ["error", {"words": true}]}}
        ],
        [
          {rules: {"spaced-line-comment": [2, "opt1", "opt2"]}},
          {rules: {"spaced-comment": ["error", "opt1", "opt2"]}}
        ]
      ].forEach(function(example){
        let originalConfig = example[0];
        let convertedConfig = example[1];

        it(`upgrades ${stringify(originalConfig)}`, function(done){
          let upgrader = new ConfigUpgrader();
          let actualConfig = upgrader.upgrade(originalConfig);

          expect(actualConfig).to.deep.eq(convertedConfig);
          expect(upgrader.report).to.lengthOf(1);
          done();
        });
      });
    });
  });
});
