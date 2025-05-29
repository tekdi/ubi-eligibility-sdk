const vm = require("vm");

async function checkBenefitEligibility(userProfile, benefit,eligibilityEvaluationLogic, strictChecking) {
  if (!benefit || !Array.isArray(benefit)) {
    return {
      isEligible: false,
      reasons: ["No eligibility criteria defined in benefit"],
    };
  }

  const reasons = [];
  const evaluationResults = {};
  const criteriaResults = [];

  for (const condition of benefit) {
    const { type, description, criteria } = condition;
    const RuleClassName = type.charAt(0).toUpperCase() + type.slice(1) + 'Rule';

    const RuleClass = require(`../services/rules/${RuleClassName}`);

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

    const ruleKey = criteria.id;
    evaluationResults[ruleKey] = passed;
    criteriaResults.push({
      ruleKey,
      passed,
      description,
      reasons: ruleReasons,
    });
  }

  // If eligibilityEvaluationLogic is present, evaluate it
  if (eligibilityEvaluationLogic) {
    let isEligible = false;
    let customRuleMessage = "";
    try {
      isEligible = vm.runInNewContext(eligibilityEvaluationLogic, evaluationResults);
     
      if (isEligible) {
        customRuleMessage = `Eligible because custom rule "${eligibilityEvaluationLogic}" evaluated to true with: ${JSON.stringify(evaluationResults)}`;
      }
    } catch (err) {
      reasons.push({
        type: "eligibilityEvaluationLogic",
        reason: `Error evaluating eligibilityEvaluationLogic: ${err.message}`,
        description: eligibilityEvaluationLogic,
      });
    }
    return {
      isEligible,
      reasons: isEligible ? [customRuleMessage] : reasons,
      evaluationResults,
      criteriaResults,
    };
  }

  // Default: eligible if no reasons
  return {
    isEligible: reasons.length === 0,
    reasons: reasons.length > 0 ? reasons : ["Eligible: All criteria passed"],
    evaluationResults,
    criteriaResults,
  };
}

module.exports = {
  checkBenefitEligibility,
};