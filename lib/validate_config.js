var CLIEngine = require("eslint").CLIEngine
  , fs = require("fs");

module.exports = function(configPath) {
  if (configPath) {
    return true;
  } else {
    let cli = new CLIEngine();
    let config = cli.getConfigForFile(null);

    return Object.keys(config.rules).length > 0;
  }
};
