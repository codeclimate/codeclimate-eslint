const sinon = require("sinon")
const chai = require("chai")
const expect = chai.expect
chai.use(require('chai-as-promised'))

const LibESLint = require("../lib/eslint")
const fs = require("fs")
const path = require("path")
const temp = require("temp")

describe("eslint integration", function() {
  let consoleMock = {}
  const STDERR = console.error

  async function executeConfig(configPath) {
    return await LibESLint.run(consoleMock, { dir: __dirname, configPath: `${__dirname}/${configPath}` })
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
    it("raise on file not found", async function() {

      await expect(executeConfig("no_lintrc/config.json")).to.be.rejectedWith(Error)
    })

    it("turns off blocked rules", async function() {
      await executeConfig("with_unsupported_rules/config.json")

      expect(consoleMock.outputErr).to.include(
        "Ignoring the following rules that rely on module resolution:",
        "\n\t * import/extensions"
      )
    })

    it("remove blocked setting", async function() {
      await executeConfig("with_unsupported_rules/config.json")

      expect(consoleMock.outputErr).to.include(
        "Ignoring the following settings that rely on module resolution:",
        "\n\t * import/resolver"
      )
    })
  })

  describe("sanitization", async function() {
    async function withMinSource(config, cb) {
      const directory = await temp.mkdir("code")
      process.chdir(directory);
      const eslintConfigPath = path.join(directory, ".eslintrc.json")
      await fs.promises.writeFile(eslintConfigPath, "{}")
      const sourcePath = path.join(directory, "index.js")
      await fs.promises.writeFile(
        sourcePath,
        [...Array(13).keys()]
          .map(() => {
            return "void(0);"
          })
          .join(""), // a long string of voids
      )
      const configPath = path.join(directory, "config.json")
      await fs.promises.writeFile(
        configPath,
        JSON.stringify({
          enabled: true,
          config: config,
          include_paths: [sourcePath],
        })
      )
      return await cb(directory)
    }
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

                  //done()
                }
              )
            }
          )
        })
      })
    }

    const BatchSanitizer = require("../lib/batch_sanitizer")
    const ESLint = require("../lib/eslint6-patch")().eslint.ESLint

    beforeEach(() => {
      sinon.spy(BatchSanitizer.prototype, "sanitizedFiles")
      sinon.spy(ESLint.prototype, "lintFiles")
    })

    afterEach(() => {
      BatchSanitizer.prototype.sanitizedFiles.restore()
      ESLint.prototype.lintFiles.restore()
    })

    it("is performed by default", async function() {
      this.timeout(5000)

      await withMinSource(
        {},
        async function(dir) {
          await LibESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json` })

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(1)
          expect(ESLint.prototype.lintFiles.firstCall.args).to.eql([[]])
        }
      )
    })

    it("is performed when explicitly specified", async function() {
      this.timeout(5000)

      await withMinSource(
        { sanitize_batch: true },
        async function(dir) {
          await LibESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json` })

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(1)
          expect(ESLint.prototype.lintFiles.firstCall.args).to.eql([[]])
        }
      )
    })

    it("can be disabled", async function() {
      this.timeout(5000)

      await withMinSource(
        { sanitize_batch: false },
        async function(dir) {
          await LibESLint.run(consoleMock, { dir: dir, configPath: `${dir}/config.json` })

          expect(BatchSanitizer.prototype.sanitizedFiles.callCount).to.eql(0)
          expect(ESLint.prototype.lintFiles.firstCall.args).to.eql([[`${dir}/index.js`]])
        }
      )
    })
  })
})
