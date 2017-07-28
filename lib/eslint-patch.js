"use strict";

const Plugins = require("eslint/lib/config/plugins");
const ModuleResolver = require("eslint/lib/util/module-resolver");

const ConfigFile = require("eslint/lib/config/config-file");

const Config = require("eslint/lib/config");
const RuleBlocklist = require("./rule_blocklist");

module.exports = function patch() {
  const skippedModules = [];
  function warnModuleNotSupported(name) {
    if(!skippedModules.includes(name)) {
      skippedModules.push(name);
      console.error(`Module not supported: ${name}`);
    }
  }

  const resolve = ModuleResolver.prototype.resolve;
  ModuleResolver.prototype.resolve = function(name, path) {
    try {
      return resolve.apply(this, [name, path]);
    } catch(e) {
      warnModuleNotSupported(name);
      if (name.match(/^eslint-plugin/)) {
        return `${__dirname}/empty-plugin.js`;
      } else {
        return `${__dirname}/empty-config.js`;
      }
    }
  };

  Plugins.prototype.loadAll = function(pluginNames) {
    for(const name of pluginNames) {
      try {

        this.load(name);

      } catch(e) {
        if (e.message.match(/^Failed to load plugin/)) {
          warnModuleNotSupported(`eslint-plugin-${name}`);
        } else {
          throw e;
        }
      }
    }
  };

  const originalGetConfig = Config.prototype.getConfig;
  Config.prototype.getConfig = function(filePath) {
    const originalConfig = originalGetConfig.apply(this, [filePath]);
    const ruleBlocklist = new RuleBlocklist();

    return ruleBlocklist.filter(
      originalConfig
    );
  };

  return require('eslint');
};
