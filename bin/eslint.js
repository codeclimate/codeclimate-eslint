#!/usr/src/app/bin/node_gc

const CODE_DIR = "/code";
process.chdir(CODE_DIR);

const ESLint = require("../lib/eslint");
const exitCode = ESLint.run({ dir: CODE_DIR });

process.exit(exitCode);
