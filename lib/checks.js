var checkCategoryMapping = {
  "accessor-pairs": "Bug Risk",
  "block-scoped-var": "Bug Risk",
  "callback-return": "Bug Risk",
  "comma-dangle": "Bug Risk",
  "complexity": "Complexity",
  "consistent-return": "Bug Risk",
  "curly": "Clarity",
  "default-case": "Bug Risk",
  "dot-location": "Clarity",
  "dot-notation": "Clarity",
  "eqeqeq": "Bug Risk",
  "global-require": "Clarity",
  "guard-for-in": "Bug Risk",
  "handle-callback-err": "Bug Risk",
  "init-declarations": "Clarity",
  "max-statements": "Complexity",
  "no-alert": "Bug Risk",
  "no-caller": "Compatibility",
  "no-case-declarations": "Bug Risk",
  "no-catch-shadow": "Bug Risk",
  "no-cond-assign": "Bug Risk",
  "no-console": "Bug Risk",
  "no-constant-condition": "Bug Risk",
  "no-control-regex": "Bug Risk",
  "no-debugger": "Bug Risk",
  "no-delete-var": "Bug Risk",
  "no-div-regex": "Bug Risk",
  "no-dupe-args": "Bug Risk",
  "no-dupe-keys": "Bug Risk",
  "no-duplicate-case": "Bug Risk",
  "no-else-return": "Clarity",
  "no-empty": "Bug Risk",
  "no-empty-character-class": "Bug Risk",
  "no-empty-label": "Bug Risk",
  "no-empty-pattern": "Bug Risk",
  "no-eq-null": "Bug Risk",
  "no-eval": "Security",
  "no-ex-assign": "Bug Risk",
  "no-extend-native": "Bug Risk",
  "no-extra-bind": "Bug Risk",
  "no-extra-boolean-cast": "Bug Risk",
  "no-extra-parens": "Bug Risk",
  "no-extra-semi": "Bug Risk",
  "no-fallthrough": "Bug Risk",
  "no-floating-decimal": "Clarity",
  "no-func-assign": "Bug Risk",
  "no-implicit-coercion": "Bug Risk",
  "no-implied-eval": "Security",
  "no-inner-declarations": "Compatibility",
  "no-invalid-regexp": "Bug Risk",
  "no-invalid-this": "Bug Risk",
  "no-irregular-whitespace": "Compatibility",
  "no-iterator": "Compatibility",
  "no-label-var": "Bug Risk",
  "no-labels": "Bug Risk",
  "no-lone-blocks": "Bug Risk",
  "no-loop-func": "Bug Risk",
  "no-magic-numbers": "Clarity",
  "no-mixed-requires": "Clarity",
  "no-multi-spaces": "Bug Risk",
  "no-multi-str": "Compatibility",
  "no-native-reassign": "Bug Risk",
  "no-negated-in-lhs": "Bug Risk",
  "no-new": "Bug Risk",
  "no-new-func": "Clarity",
  "no-new-require": "Clarity",
  "no-new-wrappers": "Bug Risk",
  "no-obj-calls": "Bug Risk",
  "no-octal": "Compatibility",
  "no-octal-escape": "Compatibility",
  "no-param-reassign": "Bug Risk",
  "no-path-concat": "Bug Risk",
  "no-process-env": "Bug Risk",
  "no-process-exit": "Bug Risk",
  "no-proto": "Compatibility",
  "no-redeclare": "Bug Risk",
  "no-regex-spaces": "Bug Risk",
  "no-restricted-modules": "Security",
  "no-return-assign": "Bug Risk",
  "no-script-url": "Security",
  "no-self-compare": "Bug Risk",
  "no-sequences": "Bug Risk",
  "no-shadow": "Bug Risk",
  "no-shadow-restricted-names": "Bug Risk",
  "no-sparse-arrays": "Bug Risk",
  "no-sync": "Bug Risk",
  "no-throw-literal": "Clarity",
  "no-undef": "Bug Risk",
  "no-undef-init": "Bug Risk",
  "no-undefined": "Compatibility",
  "no-unexpected-multiline": "Bug Risk",
  "no-unreachable": "Bug Risk",
  "no-unused-expressions": "Bug Risk",
  "no-unused-vars": "Bug Risk",
  "no-use-before-define": "Compatibility",
  "no-useless-call": "Bug Risk",
  "no-useless-concat": "Bug Risk",
  "no-void": "Compatibility",
  "no-warning-comments": "Bug Risk",
  "no-with": "Compatibility",
  "np-dupe-keys": "Bug Risk",
  "radix": "Bug Risk",
  "use-isnan": "Bug Risk",
  "use-strict": "Bug Risk",
  "valid-jsdoc": "Clarity",
  "valid-typeof": "Bug Risk",
  "vars-on-top": "Clarity",
  "wrap-iife": "Clarity",
  "yoda": "Clarity"
};

var categories = function(checkName) {
  return [checkCategoryMapping[checkName] || "Style"];
};

// Here Be Dragons: this function extracts the relevant value that triggered the issue for
// checks in the Complexity category. Unfortunately, these values are not available in a
// structured way, so we extract them from strings. That means that any check categorized
// as Complexity MUST have a rule here to extract value.
//
// If a matching string segment cannot be found, `null` will be returned.
var messageMetricValue = function(message) {
  var match = null;
  switch (message.ruleId) {
    case "complexity":
      match = message.message.match(/complexity of (\d+)/);
      break;
    case "max-statements":
      match = message.message.match(/too many statements \((\d+)\)/);
      break;
  }
  if (null !== match) {
    return parseInt(match[1], 10);
  }
  return null;
};

var metricThreshold = function(ruleId, eslintConfig) {
   return eslintConfig.rules[ruleId][1];
};

var remediationPoints = function(checkName, message, eslintConfig) {
  if (categories(checkName)[0] === "Complexity") {
    // (@base_cost + (overage * @cost_per))*1_000_000
    // cost_per: 0.1,  base: 1
    var costPer = 70000
      , points = 1000000
      , threshold = metricThreshold(message.ruleId, eslintConfig)
      , overage
      , metricValue;

    metricValue = messageMetricValue(message);
    if (null !== metricValue) {
      overage = metricValue - threshold;
      if (overage > 0) {
        points += (costPer * overage);
      }
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
