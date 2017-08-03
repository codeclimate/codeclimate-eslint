# Code Climate ESLint Engine

[![Code Climate][badge]][repo]

[badge]: https://codeclimate.com/github/codeclimate/codeclimate-eslint/badges/gpa.svg
[repo]: https://codeclimate.com/repos/github/codeclimate-eslint

`codeclimate-eslint` is a Code Climate engine that wraps [ESLint][]. You can run
it on your command line using the Code Climate CLI, or on our hosted analysis
platform.

ESLint is a tool for identifying and reporting on patterns found in
ECMAScript/JavaScript code. It can be configured using a [configuration
file][config].

[config]: http://eslint.org/docs/user-guide/configuring#using-configuration-files

### Installation

1. If you haven't already, [install the Code Climate CLI][CLI]

2. Run `codeclimate engines:enable eslint`. This command both installs the
   engine and enables it in your `.codeclimate.yml` file

3. You're ready to analyze! Browse into your project's folder and run
   `codeclimate analyze`

[cli]: https://github.com/codeclimate/codeclimate

### Configuration

#### `ignore_warnings`

By default, this engine will emit both ESLint errors and warnings as Code
Climate issues. If you prefer, you can ignore warning-level violations by
setting the `ignore_warnings` configuration option:

```yaml
eslint:
  enabled: true
  config:
    ignore_warnings: true
```

#### `extensions`

If you're using a plugin like `eslint-plugin-json` or `eslint-plugin-html`, you
will want to set this value to make sure the appropriate files are included:

```yaml
eslint:
  enabled: true
  config:
    extensions:
    - .js
    - .html
```

#### `sanitize_batch`

By default, this engine will skip files that appear to be minified (average line
length over 100). This feature can be disabled to include all files for
analysis.

```yaml
eslint:
  enabled: true
  config:
    sanitize_batch: false
```


### Need help?

For help with ESLint, [check out their documentation][eslint-docs].

If you're running into a Code Climate issue, first look over this project's
[GitHub Issues][issues], as your question may have already been covered. If not,
[go ahead and open a support ticket with us][help].

[issues]: https://github.com/codeclimate/codeclimate-eslint/issues
[help]: https://codeclimate.com/help

[eslint]: http://eslint.org
[eslint-docs]: http://eslint.org/docs/user-guide/
