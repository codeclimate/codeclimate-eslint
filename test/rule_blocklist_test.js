const RuleBlocklist = require("../lib/rule_blocklist")
  , expect = require("chai").expect
  , fs = require("fs")
  , path = require("path")
  , stringify = require("json-stable-stringify")
  , temp = require('temp');

describe("ConfigUpgrader", function() {
  describe(".report", function() {
    it("returns blocklist report with the blocked rules", function(done) {
      temp.mkdir("code ", function(err, directory) {
        if (err) { throw err; }

        process.chdir(directory);

        const configPath = path.join(directory, ".eslintrc");
        fs.writeFile(configPath, '{"rules":{"import/no-unresolved":2}}', function(err) {
          if (err) { throw err; }

          let report = RuleBlocklist.report([directory + '/.eslintrc']);
          expect(report).to.deep.eq([
            "Ignoring the following rules that rely on module resolution:",
            "",
            "* import/no-unresolved"
          ]);
          done();
        });
      });
    });

    it("when no blocked rules, it returns meaningful blocklist report", function(done) {
      temp.mkdir("code ", function(err, directory) {
        if (err) { throw err; }

        process.chdir(directory);

        const configPath = path.join(directory, ".eslintrc");
        fs.writeFile(configPath, '{"rules":{"foo/bar":2}}', function(err) {
          if (err) { throw err; }

          let report = RuleBlocklist.report([directory + '/.eslintrc']);
          expect(report).to.deep.eq([]);
          done();
        });
      });
    });
  });


  describe("#filter", function() {
    it("doesn't fail with null config", function(done) {
      let blocklist = new RuleBlocklist();
      expect(function() {
        blocklist.filter(null);
      }).to.not.throw(TypeError);
      done();
    });

    describe("rules", function() {
      [
        [
          {rules: {"import/no-restricted-paths": 1}},
          {rules: {"import/no-restricted-paths": "off"}}
        ],
        [
          {rules: {"import/no-unresolved": [2, "opt1", "opt2"]}},
          {rules: {"import/no-unresolved": "off"}}
        ],
        [
          {rules: {"node/no-hide-code-modules": 2}},
          {rules: {"node/no-hide-code-modules": "off"}}
        ]
      ].forEach(function(example){
        let originalConfig = example[0];
        let convertedConfig = example[1];

        it(`filters out ${stringify(originalConfig)}`, function(done){
          let blocklist = new RuleBlocklist();
          let actualConfig = blocklist.filter(originalConfig);

          expect(actualConfig).to.deep.eq(convertedConfig);
          expect(blocklist.report).to.lengthOf(1);
          done();
        });
      });
    });
  });
});
