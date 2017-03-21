const sinon = require("sinon");
const expect = require("chai").expect;

const ESLint = require('../lib/eslint');

const STDOUT = console.log;
const STDERR = console.error;

describe("eslint integration", function() {

  function executeConfig(configPath) {
    ESLint.run({ dir: __dirname, configPath: `${__dirname}/${configPath}`});
  }

  beforeEach(function() {
    console.log = sinon.spy();
    console.error = sinon.spy();
  });

  afterEach(function() {
    console.log = STDOUT;
    console.error = STDERR;
  });


  describe("eslintrc has not supported plugins", function() {
    it("does not raise any error", function() {
      this.timeout(3000);

      function executeUnsupportedPlugins() {
        executeConfig("with_unsupported_plugins/config.json");
      }

      expect(executeUnsupportedPlugins).to.not.throw();
      expect(console.log.called).to.be.ok;
    });
  });

  describe("validating config", function() {
    it("warns about empty config but not raise error", function() {
      function executeEmptyConfig() {
        executeConfig("empty_config/config.json");
      }

      expect(executeEmptyConfig).to.not.throw();
      sinon.assert.calledWith(console.error, 'No rules are configured. Make sure you have added a config file with rules enabled.');
    });
  });

  describe("extends plugin", function() {
    it("loads the plugin and does not include repeated issues of not found rules", function() {
      this.timeout(5000);
      const output = [];
      console.log = function(msg) {
        output.push(msg);
      };

      executeConfig("extends_airbnb/config.json");

      const ruleDefinitionIssues = output.filter(function(o) { return o.includes("Definition for rule"); });
      expect(ruleDefinitionIssues).to.be.empty;
    });
  });

});
