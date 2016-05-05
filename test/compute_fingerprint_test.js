var expect = require("chai").expect
  , computeFingerprint = require("../lib/compute_fingerprint");

describe("computeFingerprint", function() {
  it("returns a path-based fingerprint for matching checks", function() {
    var path = "path.js"
      , rule = "complexity"
      , message = "Function 'function' has a complexity of 10";

    var fingerprint = computeFingerprint(path, rule, message);

    expect(fingerprint).to.be.eq("449efcc6d162550a2b7f54eb0fdfaccd");
  });

  it("returns null for non-matching checks", function() {
    var path = "some/path.js"
      , rule = "nope"
      , message = null;

    var fingerprint = computeFingerprint(path, rule, message);

    expect(fingerprint).to.be.null;
  });
});
