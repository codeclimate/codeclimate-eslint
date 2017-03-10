/**
 * @fileoverview Providing easy access to rule documentation
 */

'use strict';

var fs = require('fs')
  , path = require('path');

function Docs() {

  var docs = Object.create(null);

  function get(ruleId) {
    return docs[ruleId];
  }

  var docsDir = path.join(__dirname, '/docs/rules');

  fs.readdirSync(docsDir).forEach(function(file) {
    var content = fs.readFileSync(docsDir + '/' + file, 'utf8');

    // Remove the .md extension from the filename
    docs[file.slice(0, -3)] = content;
  });

  return {
    get: get
  };
}

module.exports = Docs;
