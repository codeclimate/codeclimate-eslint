#!/usr/src/app/bin/node_gc

const CODE_DIR = "/code";
process.chdir(CODE_DIR);

// Redirect `console.log` so that we are the only ones
// writing to STDOUT
var stdout = console.log;
console.log = console.error;

function print(msg) {
  process.stdout.write(msg);
}

const ESLint = require("../lib/eslint");
const exitCode = ESLint.run(print, { dir: CODE_DIR });

process.exit(exitCode);
