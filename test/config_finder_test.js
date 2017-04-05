const findConfigs = require("../lib/config_finder")
  , expect = require("chai").expect
  , fs = require("fs")
  , path = require("path")
  , temp = require('temp');

describe("findConfigs", function() {
  it("finds configs", function(done) {
    temp.mkdir("code ", function(err, directory) {
      if (err) { throw err; }

      process.chdir(directory);

      const configPath = path.join(directory, ".eslintrc");
      fs.writeFile(configPath, "{}", function(err) {
        if (err) { throw err; }


        let configs = findConfigs(null, [directory + '/file.js']);
        expect(configs).to.deep.eq([directory + '/.eslintrc']);
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

            let configs = findConfigs(null, [directory + '/file.js']);
            expect(configs).to.deep.eq([directory + "/.eslintrc.json"]);
            done();
          });
        });
      });
    });
  });

  it("uses specific configs", function(done) {
    temp.mkdir("code", function(err, directory) {
      if (err) { throw err; }

      process.chdir(directory);

      const configPath = path.join(directory, "codeclimate-eslint");
      fs.writeFile(configPath, "{}", function(err) {
        if (err) { throw err; }

        let configs = findConfigs("codeclimate-eslint", [directory + '/file.js']);
        expect(configs).to.deep.eq(["codeclimate-eslint"]);
        done();
      });
    });
  });
});
