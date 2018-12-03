const SettingBlocklist = require("../lib/setting_blocklist")
  , expect = require("chai").expect
  , fs = require("fs")
  , path = require("path")
  , stringify = require("json-stable-stringify")
  , temp = require('temp');

describe("ConfigUpgrader", function() {
  describe("settings", function() {
    describe(".report", function() {
      it("returns blocklist report with the blocked settings", function(done) {
        temp.mkdir("code ", function(err, directory) {
          if (err) { throw err; }

          process.chdir(directory);

          const configPath = path.join(directory, ".eslintrc");
          fs.writeFile(configPath, '{"settings":{"import/resolver":{"webpack": {"config": "webpack.config.js"}}}}', function(err) {
            if (err) { throw err; }

            let report = SettingBlocklist.report([directory + '/.eslintrc']);
            expect(report).to.deep.eq([
              "Ignoring the following settings that rely on module resolution:",
              "",
              "* import/resolver"
            ]);
            done();
          });
        });
      });

      it("when no blocked settings, it returns meaningful blocklist report", function(done) {
        temp.mkdir("code ", function(err, directory) {
          if (err) { throw err; }

          process.chdir(directory);

          const configPath = path.join(directory, ".eslintrc");
          fs.writeFile(configPath, '{"settings":{"foo/bar":2}}', function(err) {
            if (err) { throw err; }

            let report = SettingBlocklist.report([directory + '/.eslintrc']);
            expect(report).to.deep.eq([]);
            done();
          });
        });
      });
    });


    describe("#filter", function() {
      it("doesn't fail with null config", function(done) {
        let blocklist = new SettingBlocklist();
        expect(function() {
          blocklist.filter(null);
        }).to.not.throw(TypeError);
        done();
      });

      describe("settings", function() {
        [
          [
            {settings: {"import/resolver": {} }},
            {settings: {}}
          ],
          [
            {settings: {"import/resolver": { webpack: null} }},
            {settings: {}}
          ]
        ].forEach(function(example){
          let originalConfig = example[0];
          let convertedConfig = example[1];

          it(`filters out ${stringify(originalConfig)}`, function(done){
            let blocklist = new SettingBlocklist();
            let actualConfig = blocklist.filter(originalConfig);

            expect(actualConfig).to.deep.eq(convertedConfig);
            expect(blocklist.report).to.lengthOf(1);
            done();
          });
        });
      });
    });
  });
});
