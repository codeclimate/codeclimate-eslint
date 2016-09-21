var checkCategoryMapping = require('./check_category_mapping');

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
