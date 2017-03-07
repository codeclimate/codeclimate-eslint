'use strict';
const Plugins = require("eslint/lib/config/plugins");

const Config = require("eslint/lib/config");
const ConfigUpgrader = require('./config_upgrader');

const docs = require('./docs');

module.exports = function patch(eslint) {

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
        console.error(`[DEBUG] Plugin ${name} not supported`);
      }
    }
  };


  const originalGetConfig = Config.prototype.getConfig;
  Config.prototype.getConfig = function(filePath) {
    const originalConfig = originalGetConfig.apply(this, [filePath]);
    const configUpgrader = new ConfigUpgrader();

    return configUpgrader.upgrade(originalConfig);
  };

  eslint.docs = docs;


  return eslint;
};
