var crypto = require("crypto");

var Fingerprint = function (path, rule, message) {
  this.path = path;
  this.rule = rule;
  this.message = message;
};

Fingerprint.prototype.compute = function() {
  var fingerprint = null;

  if (this.rule === "complexity") {
    var strippedMessage = this.strippedMessage(this.message);
    if(strippedMessage) {
      var md5 = crypto.createHash("md5");
      md5.update(this.path);
      md5.update(this.rule);
      md5.update(strippedMessage);

      fingerprint = md5.digest("hex");
    }
  }

  return fingerprint;
};

Fingerprint.prototype.strippedMessage = function(message) {
  var regex = /Function '\S+'/
    , stripped = message.match(regex);

  if (stripped) {
    return stripped[0];
  }
};

function computeFingerprint(path, rule, message) {
  return new Fingerprint(path, rule, message).compute();
};

module.exports = computeFingerprint;
