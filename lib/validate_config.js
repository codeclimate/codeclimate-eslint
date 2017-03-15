var CLIEngine = require("eslint").CLIEngine
  , fs = require("fs");

module.exports = function(configPath) {
  if (configPath) {
    return fs.existsSync(configPath);
  } else {
    let cli = new CLIEngine();

    try {
      let config = cli.getConfigForFile(null);
      return Object.keys(config.rules).length > 0;
    } catch (e) {
      if (e.message === "No ESLint configuration found.") {
        return false;
      } else {
        throw e;
      }
    }
  }
};
