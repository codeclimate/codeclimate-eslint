const expect = require("chai").expect
const sinon = require("sinon")

const { ConfigArrayFactory } = require("eslint/lib/cli-engine/config-array-factory")

const eslintPatch = require("../lib/eslint6-patch")

/**
 * Proper behavior is tested through integration tests.
 * This is just a quick smoke test to tell patch is working.
 */
describe("eslint6-patch", function() {
  describe("patch", function() {
    let originalLoadPlugin, originalLoadConfigData

    before(function() {
      originalLoadPlugin = ConfigArrayFactory.prototype._loadPlugin
      originalLoadConfigData = ConfigArrayFactory.prototype._loadConfigData
    })

    it("intercepts plugin loading", function() {
      eslintPatch()
      expect(originalLoadPlugin).to.not.equal(
        ConfigArrayFactory.prototype._loadPlugin,
        "ConfigArrayFactory._loadPlugin is not patched"
      )
    })

    it("intercepts rule configs", function() {
      eslintPatch()
      expect(originalLoadConfigData).to.not.equal(
        ConfigArrayFactory.prototype._loadConfigData,
        "ConfigArrayFactory._loadConfigData is not patched"
      )
    })
  })
})
