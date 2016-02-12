var CLIEngine = require("eslint").CLIEngine
  , cli = new CLIEngine()
  , fs = require("fs");

module.exports = function(configPath) {
  if (configPath) {
    return true;
  } else {
    var config = cli.getConfigForFile(null);

    return Object.keys(config.rules).length > 0;
  }
};
