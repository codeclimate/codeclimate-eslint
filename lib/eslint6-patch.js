"use strict"

const { ConfigArrayFactory } = require("eslint/lib/cli-engine/config-array-factory")

const RULES_BLOCKLIST = [
  "import/extensions",
  "import/no-restricted-paths",
  "import/no-unresolved",
  "import/no-extraneous-dependencies",
  "import/no-named-as-default",
  "import/namespace",
  "import/named",
  "import/no-absolute-path",
  "import/no-duplicates",
  "import/no-named-as-default-member",
  "import/no-cycle",
  "node/no-hide-code-modules",
  "node/no-missing-require",
]

const SETTINGS_BLOCKLIST = ["import/resolver"]

module.exports = function patch() {
  const skippedModules = []
  const loadedModules = new Set()

  function warnModuleNotSupported(name) {
    if (!skippedModules.includes(name)) {
      skippedModules.push(name)
      console.error(`Module not supported: ${name}`)
    }
  }

  function validateConfig(config) {
    if (config.rules) {
      return config
    }

    console.error(
      "No rules are configured. Make sure you have added a config file with rules enabled."
    )
    console.error(
      "See our documentation at https://docs.codeclimate.com/docs/eslint for more information."
    )

    return false
  }

  function patchPluginLoading() {
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
  }

  function patchConfigs() {
    const originalLoadConfigData = ConfigArrayFactory.prototype._loadConfigData
    ConfigArrayFactory.prototype._loadConfigData = function _loadConfigData() {
      let results = originalLoadConfigData.apply(this, arguments)
      results = [...results].filter(validateConfig)

      const adjustedConfigs = results.map((config) => {
        RULES_BLOCKLIST.forEach((ruleName) => {
          if (config.rules[ruleName] !== "off") {
            config.rules[ruleName] = "off"
            console.error("Blocked rule is turned off:", ruleName)
          }
        })

        SETTINGS_BLOCKLIST.forEach((settingName) => {
          if (config.settings && config.settings[settingName]) {
            delete config.settings[settingName]
            console.error("Blocked setting removed:", settingName)
          }
        })

        return config
      })

      return adjustedConfigs
    }
  }

  patchPluginLoading()
  patchConfigs()

  return {
    eslint: require("eslint"),
    skippedModules: [...skippedModules],
    loadedModules: [...loadedModules],
  }
}
