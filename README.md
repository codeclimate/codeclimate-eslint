# Code Climate ESLint Engine

[![Code Climate](https://codeclimate.com/repos/57f285a969744e0d830009a7/badges/5ac270c5078729d2b4e1/gpa.svg)](https://codeclimate.com/repos/57f285a969744e0d830009a7/feed)

`codeclimate-eslint` is a Code Climate engine that wraps [ESLint](https://github.com/eslint/eslint). You can run it on your command line using the Code Climate CLI, or on our hosted analysis platform.

ESLint is a tool for identifying and reporting on patterns found in ECMAScript/JavaScript code. It can be configured using a [configuration file](https://github.com/eslint/eslint#usage).

### Installation

1. If you haven't already, [install the Code Climate CLI](https://github.com/codeclimate/codeclimate).
2. Run `codeclimate engines:enable eslint`. This command both installs the engine and enables it in your `.codeclimate.yml` file.
3. You're ready to analyze! Browse into your project's folder and run `codeclimate analyze`.

### Need help?

For help with ESLint, [check out their documentation](https://github.com/eslint/eslint).

If you're running into a Code Climate issue, first look over this project's [GitHub Issues](https://github.com/codeclimate/codeclimate-eslint/issues), as your question may have already been covered. If not, [go ahead and open a support ticket with us](https://codeclimate.com/help).
