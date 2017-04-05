"use strict";

const CONFIG_FILES = require("eslint/lib/config/config-file").CONFIG_FILES
  , FileFinder = require("eslint/lib/file-finder")
  , path = require("path");

module.exports = function(configFile, analysisFiles) {
  if (configFile) {
    return [configFile];
  }

  const dirs = analysisFiles.map(function(fileName){
    return path.dirname(fileName);
  });
  const directories = Array.from(new Set(dirs));

  const localConfigFinder = new FileFinder(CONFIG_FILES, process.cwd());

  const configs = new Set();
  for (const dir of directories) {
    const configFiles = localConfigFinder.findAllInDirectoryAndParents(dir);
    for (const file of configFiles) {
      configs.add(file);
    }
  }

  return Array.from(configs);
};
