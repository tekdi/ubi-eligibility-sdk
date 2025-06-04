const { checkCriteria } = require("../../utils/eligibilityUtils");
const RuleInterface = require("../interfaces/RuleInterface");
class UserProfileRule extends RuleInterface {
  async execute(userProfile, criteria, strictCheckingFromQuery) {
    const reasons = [];
    const strictChecking =
      typeof strictCheckingFromQuery === "boolean"
        ? strictCheckingFromQuery
        : criteria.strictChecking; // Use strictChecking from query param if provided, else from criteria
    const value = userProfile[criteria.name]; // Extract the value from userProfile based on criteria name
    if (value === undefined || value === null) {
      if (strictChecking) {
        reasons.push({
          type: "userProfile",
          field: criteria.name,
          reason: `Missing required userProfile field: ${criteria.name}`,
          description: criteria.description || "",
        });
      }
      return reasons;
    }
    const isEligible = await checkCriteria( // Check if the user profile meets the criteria
      value, 
      criteria.condition,
      criteria.conditionValues
    );
    if (!isEligible) {
      reasons.push({
        type: "userProfile",
        field: criteria.name,
        reason: `Does not meet criteria: ${criteria.condition}`,
        description: criteria.description || "",
        userValue: value,
        requiredValue: criteria.conditionValues,
        condition: criteria.condition,
      });
    }
    return reasons;
  }
}

module.exports = UserProfileRule;
