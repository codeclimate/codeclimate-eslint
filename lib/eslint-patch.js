'use strict';
var meld = require('meld');
var docs = require('./docs');

var supportedPlugins = ['react', 'babel'];

module.exports = function patcher(eslint) {

  meld.around(eslint.CLIEngine, 'loadPlugins', function(joinPoint) {
    var pluginNames = joinPoint.args[0];
    var filteredPluginNames = pluginNames.filter(function(pluginName) {
      return supportedPlugins.indexOf(pluginName) >= 0;
    });
    return joinPoint.proceed(filteredPluginNames);
  });

  meld.around(eslint.CLIEngine, 'addPlugin', function() {
    return;
  });

  // meld.around(eslint.CLIEngine.Config, 'loadPackage', function(joinPoint) {
  //   var filePath = joinPoint.args[0];
  //   if (filePath.match(/^eslint-config-airbnb.*/)) {
  //     return joinPoint.proceed();
  //   } else {
  //     return {};
  //   }
  // });

  eslint.docs = docs;

  return eslint;
};
