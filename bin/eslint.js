#!/usr/src/app/bin/node_gc

const CODE_DIR = "/code";
process.chdir(CODE_DIR);

const ESLint = require("../lib/eslint");
ESLint.run(console, { dir: CODE_DIR });
