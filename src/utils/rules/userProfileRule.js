const { checkCriterion } = require("../eligibilityUtils");

class UserProfileRule {
    static extractValue(userProfile, criteria) {
        // Extracts the value from userProfile based on the criteria's name
        return userProfile[criteria.name];
    }

    async execute(value, criteria) {
        const reasons = [];
        console.log("Executing UserProfileRule with value:", value, "and criteria:", criteria);
        // Use checkCriterion for all supported conditions
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