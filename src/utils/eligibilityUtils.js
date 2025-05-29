/**
 * Check a single criteria against user value
 * @param {*} userValue - User's value for the criteria
 * @param {string|object} condition - Condition to check
 * @param {*} conditionValues - Values to compare against
 * @returns {boolean} Whether criteria is met
 */
async function checkCriteria(userValue, condition, conditionValues) {
  if (!condition)
    throw new Error("Condition is required for eligibility check");

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
      return (
        Array.isArray(conditionValues) && conditionValues.includes(userValue)
      );
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

module.exports = {
  checkCriteria,
};
