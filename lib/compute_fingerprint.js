var crypto = require("crypto");

var Fingerprint = function (path, rule, message) {
  this.path = path;
  this.rule = rule;
  this.message = message;
};

Fingerprint.prototype.compute = function() {
  var fingerprint = null;

  if (this.rule === "complexity") {
    var md5 = crypto.createHash("md5");
    md5.update(this.path);
    md5.update(this.rule);
    md5.update(this.strippedMessage(this.message));

    fingerprint = md5.digest("hex");
  }

  return fingerprint;
};

Fingerprint.prototype.strippedMessage = function(message) {
  var regex = /Function '\S+'/
    , match = message.match(regex);

  if (match) {
    return match[0];
  } else {
    return "Anonymous Function";
  }
};

function computeFingerprint(path, rule, message) {
  return new Fingerprint(path, rule, message).compute();
};

module.exports = computeFingerprint;
