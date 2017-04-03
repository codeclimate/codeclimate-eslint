var fs = require("fs");

function EngineConfig(path) {
  this.engineJSON = JSON.parse(fs.readFileSync(path));
};

EngineConfig.prototype.includePaths = function() {
  return this.engineJSON.include_paths;
};

// cc-yaml currently ends up passing bools as stringy equivalents
function _coerceBool(val) {
  if (typeof(val) === "string") {
    return val === "true";
  } else {
    return !!val;
  }
};

function UserEngineConfig(json) {
  this.json = json;
};

EngineConfig.prototype.userConfig = function() {
  return new UserEngineConfig(this.engineJSON.config || {});
};

UserEngineConfig.prototype.configPath = function() {
  return this.json.config;
};

UserEngineConfig.prototype.extensions = function() {
  return this.json.extensions;
};

UserEngineConfig.prototype.debug = function() {
  return _coerceBool(this.json.debug);
};

UserEngineConfig.prototype.ignorePath = function() {
  return this.json.ignore_path;
};

UserEngineConfig.prototype.ignoreWarnings = function() {
  return _coerceBool(this.json.ignore_warnings);
};

module.exports = EngineConfig;
