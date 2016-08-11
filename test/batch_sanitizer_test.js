var BatchSanitizer = require("../lib/batch_sanitizer")
  , expect = require("chai").expect;

describe("BatchSanitizer module", function() {
  describe(".sanitizedFiles()", function() {
    it("filters out files that appear minified", function() {
      var stderr = { contents: "", write: function(str) { this.contents += str; } }
        , sanitizer = new BatchSanitizer(
            ["./test/fixtures/minified_batch/minified.js", "./test/fixtures/minified_batch/unminified.js"],
            stderr
          );

      expect(sanitizer.sanitizedFiles()).to.eql(["./test/fixtures/minified_batch/unminified.js"]);
      expect(stderr.contents).to.match(/WARN: Skipping/);
    });
  });
});
