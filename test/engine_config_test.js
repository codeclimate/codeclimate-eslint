/* global describe: false, it: false, require: false, processs: false */
var expect = require("chai").expect
  , fs = require("fs")
  , path = require("path")
  , temp = require("temp")
  , EngineConfig = require("../lib/engine_config");

temp.track();

describe("EngineConfig", function() {
  function withConfig(config, done, cb) {
    temp.mkdir("engine-config-test", function (err, dir) {
      if (err) throw err;

      process.chdir(dir);

      fs.writeFile("config.json", JSON.stringify(config), function(err) {
        if (err) { throw err; }

        cb(new EngineConfig("config.json"));
        done();
      });
    });
  }

  describe("userConfig", function() {
    describe("ignoreWarnings", function() {
      it("is false by default", function(done) {
        withConfig({}, done, function(engine_config) {
          expect(engine_config.userConfig().ignoreWarnings()).to.eq(false);
        });
      });

      it("is false when specified", function(done) {
        withConfig({ config: { ignore_warnings: false } }, done, function(engine_config) {
          expect(engine_config.userConfig().ignoreWarnings()).to.eq(false);
        });
      });

      it("is false when specified as string", function(done) {
        withConfig({ config: { ignore_warnings: "false" } }, done, function(engine_config) {
          expect(engine_config.userConfig().ignoreWarnings()).to.eq(false);
        });
      });

      it("is true when specified", function(done) {
        withConfig({ config: { ignore_warnings: true } }, done, function(engine_config) {
          expect(engine_config.userConfig().ignoreWarnings()).to.eq(true);
        });
      });

      it("is true when specified as string", function(done) {
        withConfig({ config: { ignore_warnings: "true" } }, done, function(engine_config) {
          expect(engine_config.userConfig().ignoreWarnings()).to.eq(true);
        });
      });
    });
  });
});
