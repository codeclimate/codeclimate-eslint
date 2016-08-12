var fs = require("fs");

var MINIFIED_AVG_LINE_LENGTH_CUTOFF = 100;

function BatchSanitizer(files, stderr) {
  this.files = files;
  this.stderr = stderr || process.stderr;
}

BatchSanitizer.prototype.sanitizedFiles = function() {
  var sanitizedFiles = [];

  for(var i = 0; i < this.files.length; i++) {
    if (this.isMinified(this.files[i])) {
      this.stderr.write("WARN: Skipping " + this.files[i] + ": it appears to be minified\n");
    } else {
      sanitizedFiles.push(this.files[i]);
    }
  }

  return sanitizedFiles;
};

BatchSanitizer.prototype.isMinified = function(path) {
  var buf = fs.readFileSync(path)
    , newline = "\n".charCodeAt(0)
    , lineCount = 0
    , charsSeen = 0;

  for(var i = 0; i < buf.length; i++) {
    if (buf[i] === newline) {
      lineCount++;
    } else {
      charsSeen++;
    }
  }

  return (charsSeen / lineCount) >= MINIFIED_AVG_LINE_LENGTH_CUTOFF;
};

module.exports = BatchSanitizer;
