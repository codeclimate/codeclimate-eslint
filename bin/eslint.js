#!/usr/src/app/bin/node_gc

const CODE_DIR = "/code";
process.chdir(CODE_DIR);

// Redirect `console.log` so that we are the only ones
// writing to STDOUT
var stdout = console.log;
console.log = console.error;

const ESLint = require("../lib/eslint");
const result = ESLint.run({ dir: CODE_DIR });

for(var i in result.stdout) {
  process.stdout.write(result.stdout[i]);
}

for(var i in result.stderr) {
  process.stderr.write(result.stderr[i]);
}

process.exit(result.code);
