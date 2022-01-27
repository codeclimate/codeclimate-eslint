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

### Channels

There are a few major versions of ESLint out there. The latest major version
is 5. This engine provides a few channels for major versions of ESLint.

This branch is for the `eslint-5` channel provides experimental ESLint 5
support.

For stable ESLint 3 please see [`master`][] branch.

[`master`]: https://github.com/codeclimate/codeclimate-eslint/tree/master

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


### Plugins and configs

Engines run in containers and have no access to internet. Because of that it's
impossible to install any packages including ESLint configs and plugins.
However, many plugins are popular in the community so a few of them are
available in the container.


#### Configs

* eslint-config-airbnb
* eslint-config-airbnb-base
* eslint-config-angular
* eslint-config-dbk
* eslint-config-drupal
* eslint-config-ember
* eslint-config-es5
* eslint-config-es6
* eslint-config-google
* eslint-config-hapi
* eslint-config-jquery
* eslint-config-loopback
* eslint-config-nightmare-mode
* eslint-config-nodesecurity
* eslint-config-prettier
* eslint-config-react-app
* eslint-config-signavio
* eslint-config-signavio-test
* eslint-config-simplifield
* eslint-config-standard
* eslint-config-standard
* eslint-config-standard-jsx
* eslint-config-standard-react
* eslint-config-standard-with-typescript
* eslint-config-strongloop
* eslint-config-vue
* eslint-config-will-robinson
* eslint-config-xo
* eslint-config-xo-react
* eslint-config-xo-space

#### Plugins

* eslint-plugin-angular
* eslint-plugin-babel
* eslint-plugin-backbone
* eslint-plugin-chai-friendly
* eslint-plugin-cypress
* eslint-plugin-drupal
* eslint-plugin-ember
* eslint-plugin-es5
* eslint-plugin-eslint-comments
* eslint-plugin-flowtype
* eslint-plugin-html
* eslint-plugin-import
* eslint-plugin-inferno
* eslint-plugin-jasmine
* eslint-plugin-jest
* eslint-plugin-jquery
* eslint-plugin-jsdoc
* eslint-plugin-jsdoc
* eslint-plugin-json
* eslint-plugin-jsx-a11y
* eslint-plugin-lodash
* eslint-plugin-lodash-fp
* eslint-plugin-meteor
* eslint-plugin-mocha
* eslint-plugin-mongodb
* eslint-plugin-no-only-tests
* eslint-plugin-no-unsafe-innerhtml
* eslint-plugin-node
* eslint-plugin-prettier
* eslint-plugin-promise
* eslint-plugin-ramda
* eslint-plugin-react
* eslint-plugin-react-native
* eslint-plugin-security
* eslint-plugin-sorting
* eslint-plugin-standard
* eslint-plugin-testing-library
* eslint-plugin-vue
* eslint-plugin-vue-split-by-script-lang
* eslint-plugin-xogroup
* eslint-plugin-formatjs

##### Plugins Major Version Bump

Note that some plugins have been bumped one or more major versions up. For those
the major version is specified. You may need to update your configuration to
properly use the plugins.

* babel-eslint v10
* eslint-config-react-app v3
* eslint-config-standard v12
* eslint-config-standard-jsx v6
* eslint-config-standard-react v7
* eslint-plugin-html v4
* eslint-plugin-inferno v7
* eslint-plugin-lodash v3
* eslint-plugin-meteor v5
* eslint-plugin-mocha v5
* eslint-plugin-mongodb v1
* eslint-plugin-node v7
* eslint-plugin-prettier v3
* eslint-plugin-promise v4
* eslint-plugin-react v7
* eslint-plugin-standard v4

#### Temporarily unavailable plugins and configs

Not all packages have been updated to support ESLint 5 yet.
They were available in the `latest` (`eslint-3`) channel but are temporarily
removed from `eslint-5` channel.

* @br/eslint-plugin-laws-of-the-game
* eslint-config-apiconnect
* eslint-config-secure
* eslint-config-semistandard
* eslint-config-strongloop
* eslint-plugin-babel
* eslint-plugin-ejs
* eslint-plugin-ember
* eslint-plugin-ember-suave
* eslint-plugin-filenames
* eslint-plugin-hapi
* eslint-plugin-immutable
* eslint-plugin-import-order
* eslint-plugin-lodash
* eslint-plugin-mongodb
* eslint-plugin-react-intl
* eslint-plugin-security
* eslint-plugin-vue
* eslint-plugin-xogroup


### Need help?

For help with ESLint, [check out their documentation][eslint-docs].

If you're running into a Code Climate issue, first look over this project's
[GitHub Issues][issues], as your question may have already been covered. If not,
[go ahead and open a support ticket with us][help].

[issues]: https://github.com/codeclimate/codeclimate-eslint/issues
[help]: https://codeclimate.com/help

[eslint]: http://eslint.org
[eslint-docs]: http://eslint.org/docs/user-guide/
