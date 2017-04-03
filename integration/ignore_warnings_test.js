const fs = require("fs");
const sinon = require("sinon");
const expect = require("chai").expect;

const ESLint = require('../lib/eslint');

describe("ESlint user config for ignore_warnings", function() {
  let consoleMock = {};

  function executeConfig(configPath) {
    return ESLint.run(consoleMock, { dir: __dirname, configPath: configPath });
  }

  function configContentImplicit() {
    return `
      {
        "enabled": true,
        "config": {
          "config": "ignore_warnings/eslintrc.js"
        },
        "include_paths": [
          "/usr/src/app/integration/ignore_warnings/index.js"
        ]
      }
    `.trim();
  }

  function configContentExplicit(ignoreWarnings) {
    return `
      {
        "enabled": true,
        "config": {
          "config": "ignore_warnings/eslintrc.js",
          "ignore_warnings": ${ignoreWarnings}
        },
        "include_paths": [
          "/usr/src/app/integration/ignore_warnings/index.js"
        ]
      }
    `.trim();
  }

  function buildConfig(configContent) {
    const tmpdir = fs.mkdtempSync("/tmp/cc-eslint-test-");
    const configPath = `${tmpdir}/config.json`;
    fs.writeFileSync(configPath, configContent);
    return configPath;
  }

  beforeEach(function() {
    consoleMock.output = [];
    consoleMock.log = function(msg) { consoleMock.output.push(msg) };
    consoleMock.error = sinon.spy();
  });

  describe("ignore_warnings", function() {
    it("does emit warnings by default", function() {
      this.timeout(5000);

      const config = buildConfig(configContentImplicit());
      executeConfig(config);

      expect(consoleMock.output).to.have.lengthOf(2);
      expect(consoleMock.output[0]).to.match(/^\{.*/);
    });

    it("does emit warnings when explicitly false", function() {
      this.timeout(5000);

      const config = buildConfig(configContentExplicit("false"));
      executeConfig(config);

      expect(consoleMock.output).to.have.lengthOf(2);
      expect(consoleMock.output[0]).to.match(/^\{.*/);
    });

    it("does emit warnings when explicitly stringy false", function() {
      this.timeout(5000);

      const config = buildConfig(configContentExplicit("\"false\""));
      executeConfig(config);

      expect(consoleMock.output).to.have.lengthOf(2);
      expect(consoleMock.output[0]).to.match(/^\{.*/);
    });

    it("does not emit warnings when explicitly true", function() {
      this.timeout(5000);

      const config = buildConfig(configContentExplicit("true"));
      executeConfig(config);

      expect(consoleMock.output).to.have.lengthOf(1);
      expect(consoleMock.output[0]).to.match(/^\{.*/);
    });

    it("does not emit warnings when explicitly stringy true", function() {
      this.timeout(5000);

      const config = buildConfig(configContentExplicit("\"true\""));
      executeConfig(config);

      expect(consoleMock.output).to.have.lengthOf(1);
      expect(consoleMock.output[0]).to.match(/^\{.*/);
    });
  });
});
