const vm = require("vm");
const { UserProfileRule } = require("./rules/userProfileRule");
const { UserDocumentRule } = require("./rules/userDocumentRule");

const ruleMap = {
  userProfile: UserProfileRule,
  userDocument: UserDocumentRule,
};

async function checkBenefiteligibility(userProfile, benefit,customRules, strictChecking) {
  if (!benefit || !Array.isArray(benefit)) {
    return {
      isEligible: false,
      reasons: ["No eligibility criteria defined in benefit"],
    };
  }

  const reasons = [];
  const evaluationResults = {};
  const criterionResults = [];

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

  let passed = true;
let ruleReasons = [];
const ruleInstance = new RuleClass();
ruleReasons = await ruleInstance.execute(userProfile, criteria, strictChecking);
if (ruleReasons.length > 0) {
  passed = false;
  reasons.push(...ruleReasons);
}
    const ruleKey = criterion.id || criterion.name || `criterion_${Math.random()}`;
    evaluationResults[ruleKey] = passed;
    criterionResults.push({
      ruleKey,
      passed,
      description,
      reasons: ruleReasons,
    });
  }

  // If customRules is present, evaluate it
  if (customRules) {
    let isEligible = false;
    let customRuleMessage = "";
    try {
      isEligible = vm.runInNewContext(customRules, evaluationResults);
     
      if (isEligible) {
        customRuleMessage = `Eligible because custom rule "${customRules}" evaluated to true with: ${JSON.stringify(evaluationResults)}`;
      }
    } catch (err) {
      reasons.push({
        type: "customRules",
        reason: `Error evaluating customRules: ${err.message}`,
        description: customRules,
      });
    }
    return {
      isEligible,
      reasons: isEligible ? [customRuleMessage] : reasons,
      evaluationResults,
      criterionResults,
    };
  }

  // Default: eligible if no reasons
  return {
    isEligible: reasons.length === 0,
    reasons: reasons.length > 0 ? reasons : ["Eligible: All criteria passed"],
    evaluationResults,
    criterionResults,
  };
}

module.exports = {
  checkBenefiteligibility,
};