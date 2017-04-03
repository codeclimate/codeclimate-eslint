/* global describe: false, it: false, require: false, process: false */
var expect = require("chai").expect
  , fs = require("fs")
  , path = require("path")
  , temp = require("temp")
  , EngineConfig = require("../lib/engine_config");

temp.track();

describe("EngineConfig", function() {
  function withConfig(config, done, cb) {
    temp.open("engine-config-test", function (err, tmpFh) {
      if (err) throw err;

      fs.write(tmpFh.fd, JSON.stringify(config));
      fs.close(tmpFh.fd, function(err) {
        if (err) { throw err; }

        cb(new EngineConfig(tmpFh.path));
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
