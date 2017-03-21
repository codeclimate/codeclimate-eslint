#!/usr/src/app/bin/node_gc

const CODE_DIR = "/code";
process.chdir(CODE_DIR);

const ESLint = require("../lib/eslint");
const issues = ESLint.run({ dir: CODE_DIR });

for(var issue of issues) {
  process.stdout.write(issue);
}
