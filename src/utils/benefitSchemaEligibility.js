const { UserProfileRule } = require("./rules/userProfileRule");
const { UserDocumentRule } = require("./rules/userDocumentRule");
const ruleMap = {
  userProfile: UserProfileRule,
  userDocument: UserDocumentRule,
};

async function checkSchemaEligibility(userProfile, benefit, customRules) {
  if (!benefit || !Array.isArray(benefit)) {
    return {
      isEligible: false,
      reasons: ["No eligibility criteria defined in benefit"],
    };
  }

  const reasons = [];

  for (const criterion of benefit) {
    const { type, description, criteria } = criterion;

    const RuleClass = ruleMap[type];

    if (!RuleClass) {
      reasons.push({
        type,
        reason: `No rule class found for type: ${type}`,
        description,
      });
      continue;
    }

    // Let the rule class extract the value it needs
    const valueToCheck = RuleClass.extractValue(userProfile, criteria);
    // Optionally, handle strict checking here if needed (or inside extractValue)
    if (
      (valueToCheck === undefined || valueToCheck === null) &&
      criteria.strictChecking
    ) {
      reasons.push({
        type,
        field: criteria.name || criteria.documentKey,
        reason: `Missing required field/document: ${criteria.name || criteria.documentKey}`,
        description,
      });
      continue;
    }

    if (valueToCheck !== undefined && valueToCheck !== null) {
      const ruleInstance = new RuleClass();
      const ruleReasons = await ruleInstance.execute(valueToCheck, criteria);
      console.log("Rule reasons:", ruleReasons);
      reasons.push(...ruleReasons);
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons: reasons.length > 0 ? reasons : null,
  };
}

module.exports = {
  checkSchemaEligibility,
};
