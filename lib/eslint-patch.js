"use strict";

const Plugins = require("eslint/lib/config/plugins");
const ModuleResolver = require("eslint/lib/util/module-resolver");

const ConfigFile = require("eslint/lib/config/config-file");

const Config = require("eslint/lib/config");
const ConfigUpgrader = require("./config_upgrader");

module.exports = function patch() {
  const skippedPlugins = [];

  const resolve = ModuleResolver.prototype.resolve;
  ModuleResolver.prototype.resolve = function(name, path) {
    try {
      return resolve.apply(this, [name, path]);
    } catch(e) {
      const pluginMatch = name.match(/eslint-plugin-(.+)/);
      if(pluginMatch && skippedPlugins.indexOf(pluginMatch[1]) >= 0) {
        return `${__dirname}/empty-plugin.js`;
      }

      throw e;
    }
  };

  Plugins.loadAll = function(pluginNames) {
    const loadedPlugins = Object.keys(Plugins.getAll());
    if(loadedPlugins.length > 0) {
      return;
    }

    for(const index in pluginNames) {
      const name = pluginNames[index];
      try {

        Plugins.load(name);

      } catch(e) {
        skippedPlugins.push(name);
        console.error(`Plugin not supported: ${name}`);
      }
    }
  };

  const originalGetConfig = Config.prototype.getConfig;
  Config.prototype.getConfig = function(filePath) {
    const originalConfig = originalGetConfig.apply(this, [filePath]);
    const configUpgrader = new ConfigUpgrader();

    return configUpgrader.upgrade(originalConfig);
  };

  return require('eslint');
};
