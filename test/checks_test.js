var checks = require("../lib/checks");
var expect = require("chai").expect;

describe("checks module", function() {
  describe(".categories()", function() {
    it("returns complexity for max-statements", function() {
      expect(checks.categories("max-statements")).to.deep.eq(["Complexity"]);
    });

    it("returns style for an unknown check type", function() {
      expect(checks.categories("floofle")).to.deep.eq(["Style"]);
    });
  });

  describe(".remediationPoints()", function() {
    it("returns the default of 50,000 for a non-complexity issue", function() {
      var issue = { ruleId: "eqeqeq", message: "always use ==="};
      expect(checks.remediationPoints(issue.ruleId, issue, null)).to.eq(50000);
    });

    it("calculates the cost for a cyclomatic complexity issue", function() {
      var issue = { ruleId: "complexity", message: "Function 'complex' has a complexity of 8." }
        , config = eslintConfig({ "complexity": [2, 6] });
      expect(checks.remediationPoints(issue.ruleId, issue, config)).to.eq(1140000);
    });

    it("calculates the cost for a max-statements issue", function() {
      var issue = { ruleId: "max-statements", message: "This function has too many statements (38). Maximum allowed is 30." }
        , config = eslintConfig({ "max-statements": [2, 30] });
      expect(checks.remediationPoints(issue.ruleId, issue, config)).to.eq(1560000);
    });

    it("uses base complexity cost if metric cannot be found", function() {
      var issue = { ruleId: "complexity", message: "has a complexity of \"8\"" }
        , config = eslintConfig({ "complexity": [2, 6] });
      expect(checks.remediationPoints(issue.ruleId, issue, config)).to.eq(1000000);
    });

    it("uses base complexity cost if overage is negative somehow", function() {
      var issue = { ruleId: "complexity", message: "has a complexity of 8" }
        , config = eslintConfig({ "complexity": [2, 10] });
      expect(checks.remediationPoints(issue.ruleId, issue, config)).to.eq(1000000);
    });

    var eslintConfig = function(rulesConfig) {
      return { rules: rulesConfig };
    };
  });
});
