var checkCategoryMapping = {
  "complexity": "Complexity",
  "no-unused-vars": "Bug Risk",
  "no-empty": "Bug Risk",
  "no-console": "Bug Risk",
  "no-constant-condition": "Bug Risk",
  "no-debugger": "Bug Risk",
  "no-delete-var": "Bug Risk",
  "no-dupe-keys": "Bug Risk",
  "no-duplicate-case": "Bug Risk",
  "no-empty-character-class": "Bug Risk",
  "no-fallthrough": "Bug Risk",
  "no-func-assign": "Bug Risk",
  "no-inner-declarations": "Compatibility",
  "no-invalid-regexp": "Bug Risk",
  "no-irregular-whitespace": "Compatibility",
  "no-negated-in-lhs": "Bug Risk",
  "no-obj-calls": "Bug Risk",
  "no-octal": "Compatibility",
  "no-undef": "Bug Risk",
  "no-unreachable": "Bug Risk",
  "use-isnan": "Bug Risk",
  "valid-typeof": "Bug Risk"
};

var categories = function(checkName) {
  return [checkCategoryMapping[checkName] || "Style"]
};

var remediationPoints = function(checkName, message) {
  if (checkName === "complexity") {
    // (@base_cost + (overage * @cost_per))*1_000_000
    // cost_per: 0.1,  base: 1
    var costPer = 100000,
        points = 1000000,
        threshold = 10, // TODO: Get this from the eslintrc
        overage, complexity;

    complexity = message.message.match(/complexity of (\d+)/)[1];
    overage = complexity - threshold;

    if (overage > 0) {
      points += (costPer * overage);
    }

    return points;
  } else {
    return 50000;
  }
};

module.exports = {
  categories: categories,
  remediationPoints: remediationPoints
};
