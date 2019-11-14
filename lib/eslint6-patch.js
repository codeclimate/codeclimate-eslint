"use strict"

const { ConfigArrayFactory } = require("eslint/lib/cli-engine/config-array-factory")

const validateConfig = require("./validate_config")

const RULE_BLOCKLIST = require("./rule_blocklist")

//const SettingBlocklist = require("./setting_blocklist");

module.exports = function patch() {
  const skippedModules = []
  const loadedModules = new Set()

  function warnModuleNotSupported(name) {
    if (!skippedModules.includes(name)) {
      skippedModules.push(name)
      console.error(`Module not supported: ${name}`)
    }
  }

  const methods = [
    "_loadExtendedPluginConfig",
    "_loadExtendedShareableConfig",
    "_loadPlugin",
    "_loadExtends",
  ]

  methods.forEach((m) => {
    const original = ConfigArrayFactory.prototype[m]

    const skip = (name, msg) => {
      warnModuleNotSupported(name)
      return []
    }

    ConfigArrayFactory.prototype[m] = function() {
      const name = arguments[0]

      try {
        const result = original.apply(this, arguments)

        if (result.error) {
          return skip(name, result.error)
        }

        loadedModules.add(name)
        return result
      } catch (e) {
        return skip(name, e.message)
      }
    }
  })

  const originalLoadConfigData = ConfigArrayFactory.prototype._loadConfigData
  ConfigArrayFactory.prototype._loadConfigData = function _loadConfigData() {
    let results = originalLoadConfigData.apply(this, arguments)
    results = [...results].filter(validateConfig)

    const adjustedConfigs = results.map((config) => {
      RULE_BLOCKLIST.forEach((ruleName) => {
        if (config.rules[ruleName] !== "off") {
          config.rules[ruleName] = "off"
          console.error("Blocked rule is turned off:", ruleName)
        }
      })
      return config
    })

    return adjustedConfigs
  }

  return {
    eslint: require("eslint"),
    skippedModules: [...skippedModules],
    loadedModules: [...loadedModules],
  }
}
