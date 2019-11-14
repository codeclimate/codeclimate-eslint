const expect = require("chai").expect;
const sinon = require("sinon");

const { ConfigArrayFactory } = require("eslint/lib/cli-engine/config-array-factory")

const eslintPatch = require("../lib/eslint6-patch");

describe("eslint6-patch", function() {
  describe("patch", function() {
    let originalFunction;

    before(function() {
      originalFunction = ConfigArrayFactory.prototype._loadPlugin;
    });

    /**
     * Proper behavior is tested through integration tests. This is just a quick smoke test.
     */
    it("intercepts plugins", function() {
      eslintPatch();
      expect(originalFunction).to.not.equal(ConfigArrayFactory.prototype._loadPlugin, "ConfigArrayFactory._loadPlugin is not patched");
    });
  });
});
