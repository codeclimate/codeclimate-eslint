const sinon = require("sinon");
const expect = require("chai").expect;

global.gc = function(){};

const STDOUT = console.log;
const STDERR = console.error;

describe("eslint integration", function() {
  describe("eslintrc has not supported plugins", function() {
    before(function() {
      console.log = sinon.spy();
      console.error = sinon.spy();
    });

    after(function() {
      console.log = STDOUT;
      console.error = STDERR;
    });

    it("does not raise any error", function() {
      this.timeout(3000);

      var consoleStub = {
        log: sinon.spy(),
        error: sinon.spy()
      };

      function execute() {
        const ESLint = require('../lib/eslint');
        ESLint.run({ dir: __dirname, configPath: `${__dirname}/with_unsupported_plugins/config.json`});
      }

      expect(execute).to.not.throw();
      expect(console.log.called).to.be.ok;
    });
  });

});
