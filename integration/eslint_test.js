const expect = require("chai").expect;

global.gc = function(){};

describe("eslint integration", function() {
  describe("eslintrc has not supported plugins", function() {
    it("does not raise any error", function() {
      this.timeout(3000);

      function execute() {
        const ESLint = require('../lib/eslint');
        ESLint.run({ dir: __dirname, configPath: `${__dirname}/with_unsupported_plugins/config.json`});
      }

      expect(execute).to.not.throw();
    });
  });

});
