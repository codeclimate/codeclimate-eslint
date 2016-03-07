/**
 * @fileoverview Providing easy access to rule documentation
 */

'use strict';

var fs = require('fs')
  , path = require('path');

//------------------------------------------------------------------------------
// Privates
//------------------------------------------------------------------------------

var docs = Object.create(null);

function load() {
  var docsDir = path.join(__dirname, '/docs/rules');

  fs.readdirSync(docsDir).forEach(function(file) {
    var content = fs.readFileSync(docsDir + '/' + file, 'utf8');

    // Remove the .md extension from the filename
    docs[file.slice(0, -3)] = content;
  });
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

exports.get = function(ruleId) {
  return docs[ruleId];
};

//------------------------------------------------------------------------------
// Initialization
//------------------------------------------------------------------------------

// loads existing docs
load();
