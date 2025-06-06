const vm = require("vm");
const logger = require("../utils/logger");
async function checkBenefitEligibility(
  userProfile,
  benefit,
  eligibilityEvaluationLogic,
  strictChecking
) {
  if (!benefit || !Array.isArray(benefit)) { // Check if benefit is defined and is an array
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
    const RuleClassName = type.charAt(0).toUpperCase() + type.slice(1) + "Rule"; // Convert type to RuleClassName (e.g., "age" to "AgeRule")

    const RuleClass = require(`../services/rules/${RuleClassName}`); // Dynamically require the rule class based on type

    if (!RuleClass) { // If no rule class is found, log the reason and continue
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
    ruleReasons = await ruleInstance.execute( // Execute the rule criteria
      userProfile,
      criteria,
      strictChecking
    );

    if (ruleReasons.length > 0) { // If ruleReasons are present, it means the rule did not pass
      passed = false;
      reasons.push(...ruleReasons);
    }

    const ruleKey = criteria.id; // Use criteria.id as the key for evaluation results
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
      isEligible = vm.runInNewContext( // Use vm to safely evaluate the eligibility logic
        eligibilityEvaluationLogic,
        evaluationResults
      );

      if (isEligible) {
        customRuleMessage = `Eligible because custom rule "${eligibilityEvaluationLogic}" evaluated to true with: ${JSON.stringify(evaluationResults)}`;
      }
    } catch (err) {
      reasons.push({
        type: "eligibilityEvaluationLogic",
        reason: `Error evaluating eligibilityEvaluationLogic: ${err.message}`,
        description: eligibilityEvaluationLogic,
      });
      logger.error("Error evaluating eligibilityEvaluationLogic:", err);
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
