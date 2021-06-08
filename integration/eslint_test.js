const sinon = require("sinon")
const expect = require("chai").expect

const ESLint = require("../lib/eslint")
const fs = require("fs")
const path = require("path")
const temp = require("temp")

describe("eslint integration", function() {
  let consoleMock = {}
  const STDERR = console.error

  function executeConfig(configPath) {
    return ESLint.run(consoleMock, { dir: __dirname, configPath: `${__dirname}/${configPath}` })
  }

  beforeEach(function() {
    consoleMock.output = []
    consoleMock.outputErr = []
    consoleMock.log = function() {
      consoleMock.output.push(...arguments)
    }
    consoleMock.error = console.error = function() {
      consoleMock.outputErr.push(...arguments)
    }
  })

  afterEach(function() {
    console.error = STDERR
  })

  describe("validating config", function() {
    it("raise on file not found", function() {
      function executeNoLintrc() {
        executeConfig("no_lintrc/config.json")
      }

      expect(executeNoLintrc).to.throw()
    })

    it("turns off blocked rules", function() {
      executeConfig("with_unsupported_rules/config.json")

      expect(consoleMock.outputErr).to.include(
        "Ignoring the following rules that rely on module resolution:",
        "\n\t * import/extensions"
      )
    })

    it("remove blocked setting", function() {
      executeConfig("with_unsupported_rules/config.json")

      expect(consoleMock.outputErr).to.include(
        "Ignoring the following settings that rely on module resolution:",
        "\n\t * import/resolver"
      )
    })
  })

  describe("sanitization", function() {
    function withMinifiedSource(config, cb, done) {
      temp.mkdir("code", function(err, directory) {
        if (err) {
          throw err
        }

        process.chdir(directory)

        const eslintConfigPath = path.join(directory, ".eslintrc.json")
        fs.writeFile(eslintConfigPath, "{}", function(err) {
          if (err) {
            throw err
          }

          const sourcePath = path.join(directory, "index.js")
          fs.writeFile(
            sourcePath,
            [...Array(13).keys()]
              .map(() => {
                return "void(0);"
              })
              .join(""), // a long string of voids
            function(err) {
              if (err) {
                throw err
              }

              const configPath = path.join(directory, "config.json")
              fs.writeFile(
                configPath,
                JSON.stringify({
                  enabled: true,
                  config: config,
                  include_paths: [sourcePath],
                }),
                function(err) {
                  if (err) {
                    throw err
                  }

                  cb(directory)

                  done()
                }
              )
            }
          )
        })
      })
    }

    const BatchSanitizer = require("../lib/batch_sanitizer")
    const CLIEngine = require("../lib/eslint6-patch")().eslint.CLIEngine

    beforeEach(() => {
      sinon.spy(BatchSanitizer.prototype, "sanitizedFiles")
      sinon.spy(CLIEngine.prototype, "executeOnFiles")
    })

    afterEach(() => {
      BatchSanitizer.prototype.sanitizedFiles.restore()
      CLIEngine.prototype.executeOnFiles.restore()
    })

    it("is performed by default", function(done) {
      this.timeout(5000)

      withMinifiedSource(
        {},
        function(dir) {
          ESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json` })

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(1)
          expect(CLIEngine.prototype.executeOnFiles.firstCall.args).to.eql([[]])
        },
        done
      )
    })

    it("is performed when explicitly specified", function(done) {
      this.timeout(5000)

      withMinifiedSource(
        { sanitize_batch: true },
        function(dir) {
          ESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json` })

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(1)
          expect(CLIEngine.prototype.executeOnFiles.firstCall.args).to.eql([[]])
        },
        done
      )
    })

    it("can be disabled", function(done) {
      this.timeout(5000)

      withMinifiedSource(
        { sanitize_batch: false },
        function(dir) {
          ESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json` })

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(0)
          expect(CLIEngine.prototype.executeOnFiles.firstCall.args).to.eql([[`${dir}/index.js`]])
        },
        done
      )
    })
  })
})
