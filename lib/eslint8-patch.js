"use strict"

const {
  Legacy: {
      ConfigArray,
      ConfigArrayFactory
  }
} = require("@eslint/eslintrc")

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
  const disabledRules = new Set()
  const removedSettings = new Set()

  function warnModuleNotSupported(name, msg) {
    if (!skippedModules.includes(name)) {
      skippedModules.push(name);
      console.error(`Module not supported: ${name}`);
      console.error(msg);
    }
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
        warnModuleNotSupported(name, msg)
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

  function patchConfigArray() {
    const orig = ConfigArray.prototype.extractConfig
    ConfigArray.prototype.extractConfig = function extractConfig() {
      const config = orig.apply(this, arguments)

      if (config.rules) {
        RULES_BLOCKLIST.forEach((ruleName) => {
          if (config.rules[ruleName] !== "off") {
            config.rules[ruleName] = "off"
            disabledRules.add(ruleName)
          }
        })
      }

      if (config.settings) {
        SETTINGS_BLOCKLIST.forEach((settingName) => {
          if (config.settings[settingName]) {
            delete config.settings[settingName]
            removedSettings.add(settingName)
          }
        })
      }

      return config
    }
  }

  patchPluginLoading()
  patchConfigArray()

  return {
    eslint: require("eslint"),
    skippedModules: () => [...skippedModules],
    loadedModules: () => [...loadedModules],
    removedSettings: () => [...removedSettings],
    disabledRules: () => [...disabledRules],
  }
}
