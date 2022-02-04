#!/usr/src/app/bin/node_gc

const fs = require("fs")
const glob = require("glob")
const stream = require('stream');

const patch = require("./eslint6-patch")()
const docs = require("./docs")()
const BatchSanitizer = require("./batch_sanitizer")
const EngineConfig = require("./engine_config")
const checks = require("./checks")
const computeFingerprint = require("./compute_fingerprint")

const ESLint = patch.eslint.ESLint
const options = { extensions: [".js"], ignore: true, useEslintrc: true, baseConfig: {} }

async function run(console, runOptions) {
  const STDOUT = console.log
  console.log = console.error

  var configPath = runOptions.configPath || "/config.json"
  var codeDir = runOptions.dir || "/code"

  var cli // instantiation delayed until after options are (potentially) modified
  var debug = false
  var ignoreWarnings = false
  var sanitizeBatch = true
  var ESLINT_WARNING_SEVERITY = 1

  // a wrapper for emitting perf timing
  function runWithTiming(name, fn) {
    const start = new Date()
    const result = fn()

    if (debug) {
      const duration = (new Date() - start) / 1000
      console.error("eslint.timing." + name + ": " + duration + "s")
    }

    return result
  }

  function contentBody(check) {
    var content = docs.get(check) || "For more information visit "
    return content + "Source: http://eslint.org/docs/rules/\n"
  }

  function buildIssueJson(message, path) {
    // ESLint doesn't emit a ruleId in the
    // case of a fatal error (such as an invalid
    // token)
    var checkName = message.ruleId
    if (message.fatal) {
      checkName = "fatal"
    }
    var line = message.line || 1
    var column = message.column || 1

    var issue = {
      type: "issue",
      categories: checks.categories(checkName),
      check_name: checkName,
      description: message.message,
      content: {
        body: contentBody(checkName),
      },
      location: {
        path: path,
        positions: {
          begin: {
            line: line,
            column: column,
          },
          end: {
            line: line,
            column: column,
          },
        },
      },
      remediation_points: checks.remediationPoints(checkName, message, cli.calculateConfigForFile(path)),
    }

    var fingerprint = computeFingerprint(path, checkName, message.message)

    if (fingerprint) {
      issue["fingerprint"] = fingerprint
    }

    var readableStream = new stream.Readable({ objectMode: true })
    readableStream.push(issue)
    readableStream.push(null)

    return readableStream
  }

  function isFileWithMatchingExtension(file, extensions) {
    var stats = fs.lstatSync(file)
    var extension = "." + file.split(".").pop()
    return stats.isFile() && !stats.isSymbolicLink() && extensions.indexOf(extension) >= 0
  }

  async function isFileIgnoredByLibrary(file) {
    return await cli.isPathIgnored(file)
  }

  function prunePathsWithinSymlinks(paths) {
    // Extracts symlinked paths and filters them out, including any child paths
    var symlinks = paths.filter(function(path) {
      return fs.lstatSync(path).isSymbolicLink()
    })

    return paths.filter(function(path) {
      var withinSymlink = false
      symlinks.forEach(function(symlink) {
        if (path.indexOf(symlink) === 0) {
          withinSymlink = true
        }
      })
      return !withinSymlink
    })
  }

  function inclusionBasedFileListBuilder(includePaths) {
    console.log('inclusionBasedFileListBuilder')
    // Uses glob to expand the files and directories in includePaths, filtering
    // down to match the list of desired extensions.
    return async function(extensions) {
      console.log('buildFileList')
      var analysisFiles = []

      await Promise.all(includePaths.map(async function(fileOrDirectory, i) {
        console.log('fileOrDirectory')
        console.log(fileOrDirectory)
        if (/\/$/.test(fileOrDirectory)) {
          // if it ends in a slash, expand and push
          var filesInThisDirectory = glob.sync(fileOrDirectory + "/**/**")
          prunePathsWithinSymlinks(filesInThisDirectory).forEach(async function(file, j) {
            const isIgnored = await isFileIgnoredByLibrary(file)
            if (!isIgnored && isFileWithMatchingExtension(file, extensions)) {
              analysisFiles.push(file)
            }
          })
        } else {
          console.log(`is file matching? ${isFileWithMatchingExtension(fileOrDirectory, extensions)}`)
          const isIgnored = await isFileIgnoredByLibrary(fileOrDirectory)
          console.log(`is ignored? ${isIgnored}`)
          if(
            !isIgnored &&
            isFileWithMatchingExtension(fileOrDirectory, extensions)
          ) {
            analysisFiles.push(fileOrDirectory)
          }
        }
      }))

      return analysisFiles
    }
  }

  function overrideOptions(userConfig) {
    console.log('overrideOptions')
    if (userConfig.configPath) {
      options.overrideConfigFile = codeDir + "/" + userConfig.configPath
      options.useEslintrc = false
    }

    if (userConfig.extensions) {
      options.extensions = userConfig.extensions
    }

    if (userConfig.ignorePath) {
      options.ignorePath = userConfig.ignorePath
    }

    ignoreWarnings = userConfig.ignoreWarnings
    debug = userConfig.debug
    sanitizeBatch = userConfig.sanitizeBatch
  }

  async function analyzeFiles(analysisFiles) {
    console.log('analyzeFiles')
    var batchNum = 0,
      batchSize = 10,
      batchFiles,
      batchReport

    while (analysisFiles.length > 0) {
      batchFiles = analysisFiles.splice(0, batchSize)
      if (sanitizeBatch) {
        batchFiles = new BatchSanitizer(batchFiles).sanitizedFiles()
      }

      if (debug) {
        console.error("Analyzing: " + batchFiles)
      }

      /*runWithTiming("analyze-batch-" + batchNum, function() {
        batchReport = cli.lintFiles(batchFiles)
      })*/
      batchReport = await cli.lintFiles(batchFiles);

      console.log(`batchreport`)
      console.log(batchReport)
      runWithTiming("report-batch" + batchNum, function() {
        batchReport.forEach(function(result) {
          var path = result.filePath.replace(/^\/code\//, "")

          result.messages.forEach(function(message) {
            if (ignoreWarnings && message.severity === ESLINT_WARNING_SEVERITY) {
              return
            }

            var readableJsonStream = buildIssueJson(message, path)
            var output = ""
            readableJsonStream.on('data', (chunk) => {
              output = output + `${JSON.stringify(chunk)}`
            })
            readableJsonStream.on('end', () => process.stdout.write(output + "\u0000\n"))
          })
        })
      })
      runWithTiming("gc-batch-" + batchNum, function() {
        batchFiles = null
        batchReport = null
        global.gc()
      })

      batchNum++
    }
  }

  function logInfo() {
    const printList = function(list) {
      const [first, ...rest] = list.sort()
      console.error("\t * " + first + rest.join("\n\t * "))
    }

    console.error("Ignoring the following rules that rely on module resolution:")
    printList(patch.disabledRules())

    console.error("Ignoring the following settings that rely on module resolution:")
    printList(patch.removedSettings())

    console.error("Skipped modules")
    printList(patch.skippedModules())

    if (debug) {
      console.error("Loaded modules")
      printList(patch.loadedModules())
    }
  }

  // No explicit includes, let's try with everything
  var buildFileList = inclusionBasedFileListBuilder(["./"])

  runWithTiming("engineConfig", function() {
    if (fs.existsSync(configPath)) {
      var engineConfig = new EngineConfig(configPath)

      if (engineConfig.includePaths) {
        buildFileList = inclusionBasedFileListBuilder(engineConfig.includePaths)
      }

      overrideOptions(engineConfig.userConfig)
    }
  })

  cli = new ESLint(options)

  console.log('options')
  console.log(options)

  /*var analysisFiles = runWithTiming("buildFileList", function() {
    return buildFileList(options.extensions)
  })*/
  var analysisFiles = await buildFileList(options.extensions)

  console.log(`analysisFiles ${analysisFiles.length}`)

  await analyzeFiles(analysisFiles)

  logInfo()
}

module.exports = { run }
