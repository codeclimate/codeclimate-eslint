const sinon = require("sinon");
const expect = require("chai").expect;

const ESLint = require('../lib/eslint');

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

  describe("output", function() {
    it("is not messed up", function() {
      this.timeout(5000);

      executeConfig("output_mess/config.json");

      expect(consoleMock.output).to.have.lengthOf(1);
      expect(consoleMock.output[0]).to.match(/^\{.*/);
    });
  });

});
