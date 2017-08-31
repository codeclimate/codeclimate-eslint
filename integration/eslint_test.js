const sinon = require("sinon");
const expect = require("chai").expect;

const ESLint = require('../lib/eslint');
const fs = require("fs");
const path = require("path")
const temp = require('temp');

describe("eslint integration", function() {
  let consoleMock = {};

  function executeConfig(configPath) {
    return ESLint.run(consoleMock, { dir: __dirname, configPath: `${__dirname}/${configPath}`});
  }

  beforeEach(function() {
    consoleMock.output = [];
    consoleMock.log = function(msg) { consoleMock.output.push(msg) };
    consoleMock.error = sinon.spy();
  });

  describe("eslintrc has not supported plugins", function() {
    it("does not raise any error", function() {
      this.timeout(3000);

      function executeUnsupportedPlugins() {
        executeConfig("with_unsupported_plugins/config.json");
      }

      expect(executeUnsupportedPlugins).to.not.throw();
      expect(consoleMock.output).to.not.be.empty;
    });
  });

  describe("validating config", function() {
    it("warns about empty config but not raise error", function() {
      function executeEmptyConfig() {
        executeConfig("empty_config/config.json");
      }

      expect(executeEmptyConfig).to.not.throw();
      sinon.assert.calledWith(consoleMock.error, 'No rules are configured. Make sure you have added a config file with rules enabled.');
    });
  });

  describe("extends plugin", function() {
    it("loads the plugin and does not include repeated issues of not found rules", function() {
      this.timeout(5000);
      executeConfig("extends_airbnb/config.json");

      const ruleDefinitionIssues = consoleMock.output.filter(function(o) { return o.includes("Definition for rule"); });
      expect(ruleDefinitionIssues).to.be.empty;
    });
  });

  describe("sanitization", function() {
    function withMinifiedSource(config, cb, done) {
      temp.mkdir("code", function(err, directory) {
        if (err) { throw err; }

        process.chdir(directory);

        const eslintConfigPath = path.join(directory, ".eslintrc.json");
        fs.writeFile(eslintConfigPath, "{}", function(err) {
          if (err) { throw err; }

          const sourcePath = path.join(directory, "index.js");
          fs.writeFile(sourcePath,
            [...Array(13).keys()].map(()=>{ return "void(0);"; }).join(""), // a long string of voids
            function(err) {
              if (err) { throw err; }

              const configPath = path.join(directory, "config.json");
              fs.writeFile(
                configPath,
                JSON.stringify({
                  "enabled": true,
                  "config": config,
                  "include_paths": [sourcePath]
                }),
                function(err) {
                  if (err) { throw err; }

                  cb(directory);

                  done();
                }
              );
            }
          );
        });
      });
    }

    const BatchSanitizer = require("../lib/batch_sanitizer");
    const CLIEngine = require('../lib/eslint-patch')().CLIEngine;

    beforeEach(() => {
      sinon.spy(BatchSanitizer.prototype, "sanitizedFiles");
      sinon.spy(CLIEngine.prototype, "executeOnFiles");
    });
    afterEach(() => {
      BatchSanitizer.prototype.sanitizedFiles.restore();
      CLIEngine.prototype.executeOnFiles.restore();
    });

    it("is performed by default", function(done) {
      this.timeout(5000);

      withMinifiedSource(
        {},
        function(dir) {
          ESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json`});

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(1);
          expect(CLIEngine.prototype.executeOnFiles.firstCall.args).to.eql([[]]);
        },
        done
      );
    });

    it("is performed by when explicitly specified", function(done) {
      this.timeout(5000);

      withMinifiedSource(
        { sanitize_batch: true },
        function(dir) {
          ESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json`});

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(1);
          expect(CLIEngine.prototype.executeOnFiles.firstCall.args).to.eql([[]]);
        },
        done
      );
    });

    it("is can be disabled", function(done) {
      this.timeout(5000);

      withMinifiedSource(
        { sanitize_batch: false },
        function(dir) {
          ESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json`});

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(0);
          expect(CLIEngine.prototype.executeOnFiles.firstCall.args).to.eql([[`${dir}/index.js`]]);
        },
        done
      );
    });
  });

  describe("output", function() {
    it("is not messed up", function() {
      this.timeout(5000);

      executeConfig("output_mess/config.json");

      expect(consoleMock.output).to.have.lengthOf(1);
      expect(consoleMock.output[0]).to.match(/^\{.*/);
    });
  });

});
