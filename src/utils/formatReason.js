/**
 * Generates a human-readable eligibility failure reason string.
 * @param {string} condition - The condition type (e.g., 'in', 'equals').
 * @param {*} conditionValues - The required value(s).
 * @param {*} userValue - The actual user value.
 * @returns {string} - The formatted reason string.
 */
function formatReason(condition, conditionValues, userValue) {
  let reason = "";

  if (condition === "in") {
    reason += ` (Required: ${conditionValues.join(", ")}, Got: ${userValue})`;
  } else if (
    condition === "less than equals" ||
    condition === "less_than_equals"
  ) {
    reason += ` (Required: <= ${conditionValues}, Got: ${userValue})`;
  } else if (
    condition === "greater than equals" ||
    condition === "greater_than_equals"
  ) {
    reason += ` (Required: >= ${conditionValues}, Got: ${userValue})`;
  } else if (condition === "equals") {
    reason += ` (Required: ${conditionValues}, Got: ${userValue})`;
  } else {
    reason += ` (Condition: ${condition}, Required: ${conditionValues}, Got: ${userValue})`;
  }

  return reason;
}

module.exports = { formatReason };
