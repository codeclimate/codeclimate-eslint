var expect = require("chai").expect
  , fs = require("fs")
  , path = require("path")
  , temp = require('temp')
  , validateConfig = require("../lib/validate_config");

temp.track();

describe("validateConfig", function() {
  it("returns true if given a file", function() {
    expect(validateConfig("foo.config")).to.eq(true);
  });

  it("returns false if no files exist", function(done) {
    temp.mkdir("no-config", function(err, directory) {
      if (err) { throw err; }

      process.chdir(directory);

      expect(validateConfig(null)).to.eq(false);
      done();
    });
  });

  it("returns true if an eslintrc exists", function(done) {
    temp.mkdir("config", function(err, directory) {
      if (err) { throw err; }

      process.chdir(directory);

      var configPath = path.join(directory, ".eslintrc.json");
      var config = {
        rules: {
          strict: 0
        }
      };

      fs.writeFile(configPath, JSON.stringify(config), function(err) {
        if (err) { throw err; }

        expect(validateConfig(null)).to.eq(true);
        done();
      });
    });
  });
});
