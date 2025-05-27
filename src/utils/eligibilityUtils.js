/**
 * Check a single criterion against user value
 * @param {*} userValue - User's value for the criterion
 * @param {string|object} condition - Condition to check
 * @param {*} conditionValues - Values to compare against
 * @returns {boolean} Whether criterion is met
 */
async function checkCriterion(userValue, condition, conditionValues) {
  if (!condition) throw new Error("Condition is required for eligibility check");

  let conditionStr;
  if (typeof condition === "object") {
    conditionStr = condition.condition || condition?.criteria?.condition;
    if (!conditionStr) throw new Error("Invalid condition object structure");
  } else {
    conditionStr = condition;
  }

  conditionStr = conditionStr.toLowerCase().trim();

  switch (conditionStr) {
    case "equals":
      return userValue === conditionValues;
    case "in":
      return Array.isArray(conditionValues) && conditionValues.includes(userValue);
    case "greater than equals":
    case "greater_than_equals":
      return Number(userValue) >= Number(conditionValues);
    case "less than equals":
    case "less_than_equals":
      return Number(userValue) <= Number(conditionValues);
    case "between":
      if (!Array.isArray(conditionValues) || conditionValues.length !== 2)
        throw new Error("Between condition requires an array of two values");
      const [min, max] = conditionValues.map(Number);
      const value = Number(userValue);
      return value >= min && value <= max;
    default:
      throw new Error(`Unsupported condition: ${conditionStr}`);
  }
}

/**
 * Apply a custom rule
 * @param {*} userValue 
 * @param {*} rule 
 * @returns {boolean}
 */
function applyCustomRule(userValue, rule) {
  if (!rule.condition || rule.value === undefined) {
    throw new Error("Custom rule must have condition and value properties");
  }

  const value = Number(userValue);
  const ruleValue = Number(rule.value);

  switch (rule.condition.toLowerCase()) {
    case "equals":
      return value === ruleValue;
    case "not equals":
      return value !== ruleValue;
    case "greater than":
      return value > ruleValue;
    case "less than":
      return value < ruleValue;
    case "greater than equals":
      return value >= ruleValue;
    case "less than equals":
      return value <= ruleValue;
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(userValue);
    case "not in":
      return Array.isArray(rule.value) && !rule.value.includes(userValue);
    default:
      throw new Error(`Unsupported custom condition: ${rule.condition}`);
  }
}

module.exports = {
  checkCriterion,
  applyCustomRule,
};
