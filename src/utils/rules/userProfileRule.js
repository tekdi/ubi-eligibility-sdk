const { checkCriterion } = require("../eligibilityUtils");
class UserProfileRule {
    async execute(userProfile, criteria, strictCheckingFromQuery) {
        const reasons = [];
        const strictChecking = 
            typeof strictCheckingFromQuery === "boolean"
                ? strictCheckingFromQuery
                : criteria.strictChecking;
        const value = userProfile[criteria.name];
        if ((value === undefined || value === null)) {
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
        const isEligible = await checkCriterion(
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

module.exports = { UserProfileRule };