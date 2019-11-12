"use strict";

const CONFIG_FILES = [
    ".eslintrc.js",
    ".eslintrc.yaml",
    ".eslintrc.yml",
    ".eslintrc.json",
    ".eslintrc",
    "package.json",
];

const FileFinder = require("./file_finder")
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
