const { checkCriterion, applyCustomRule } = require("../utils/eligibilityUtils");
const {
    checkSchemaEligibility,
    checkDocumentValidity,
    validateDocument
  } = require('../utils/benefitSchemaEligibility.js')
const vm = require("vm");
class EligibilityService {
  constructor() {}

  /**
   * Check eligibility for all provided benefit schemas
   * @param {Object} userProfile - User profile data
   * @param {Array} benefitSchemas - Array of benefit schemas
   * @param {Object} customRules - Optional custom rules
   * @returns {Object} Eligibility results
   */
  async checkEligibility(userProfile, benefitSchemas, customRules) {
    const results = {
      eligible: [],
      ineligible: [],
      errors: [],
    };

    for (const schema of benefitSchemas) {
      try {
        const benefitCrateria = schema.eligibility;
        if (!customRules) {
          const eligibilityResult = await checkSchemaEligibility(
            userProfile,
            benefitCrateria,
            customRules
          );

          if (eligibilityResult.isEligible) {
            results.eligible.push({
              schemaId: schema.id,
            });
          } else {
            results.ineligible.push({
              schemaId: schema.id,
              reasons: eligibilityResult.reasons,
            });
          }
           continue;
        }
         // Custom rules exist – evaluate each criterion individually by its `id`
      const evaluationResults = {};
      const criterionResults = []; // Optional: for reason tracking

      for (const criterion of schema.eligibility) { 
         const benefitCrateria = criterion;
        const ruleId = benefitCrateria?.id;
        if (!ruleId) {
          throw new Error(`Missing rule id in criterion for schema: ${benefitCrateria.id}`);
        }

        const result = await checkSchemaEligibility(userProfile, [benefitCrateria], customRules);
        evaluationResults[ruleId] = result.isEligible;
console.log(evaluationResults,'==',criterionResults)
        criterionResults.push({
          ruleId,
          passed: result.isEligible,
          description: criterion.description,
          reasons: result.reasons,
        });
      }
      const expression = customRules;
      const isEligible = vm.runInNewContext(expression, evaluationResults);
      if (isEligible) {
        results.eligible.push({ schemaId: schema.id });
      } else {
        results.ineligible.push({
          schemaId: schema.id,
          reasons: criterionResults.filter((r) => !r.passed), // Optional
        });
      }
      } catch (error) {
        results.errors.push({
          schemaId: schema.id || "Unknown",
          error: error.message,
        });
      }
    }

    return results;
  }


  /**
   * Check if a user is eligible for a specific benefit scheme
   * @param {Object} userProfile - User profile data
   * @param {Object} scheme - Benefit scheme to check against
   * @returns {Object} Eligibility result with reasons
   */
  async checkUserEligibility(userProfile, scheme) {
    const reasons = [];
    const enSchema = scheme.en;

    if (reasons.length === 0) {
      // Check each eligibility criterion
      for (const criterion of enSchema.eligibility) {
        const { type, description, criteria } = criterion;
        const { name, condition, conditionValues } = criteria;

        // Get user value for the criterion
        const userValue = userProfile[name];
        if (userValue === undefined) {
          reasons.push(`Missing required field: ${name} (${description})`);
          continue;
        }

        // Check document requirements if specified
        if (criterion.allowedProofs) {
          const hasValidDocument = await checkDocumentValidity(
            userProfile,
            criterion
          );
          if (!hasValidDocument) {
            reasons.push(`Missing or invalid document for: ${description}`);
            continue;
          }
        }

        // Apply the condition check
        const isEligible = await checkCriterion(
          userValue,
          condition,
          conditionValues
        );
         if (!isEligible) {
          reasons.push({
            type: type,
            field: name,
            reason: `Does not meet ${type} criteria: ${description}`,
            description: description,
            userValue: userValue,
            requiredValue: conditionValues,
            condition: condition,
          });
        }
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons: reasons,
    };
  }

  /**
   * Check which users are eligible for a specific benefit scheme
   * @param {Array} userProfiles - Array of user profiles
   * @param {Object} scheme - Benefit scheme to check against
   * @returns {Object} List of eligible and ineligible users with reasons
   */
  async checkUsersEligibility(userProfiles, scheme) {
    const results = {
      eligibleUsers: [],
      ineligibleUsers: [],
    };

    for (const userProfile of userProfiles) {
      const eligibilityResult = await this.checkUserEligibility(
        userProfile,
        scheme
      );

      if (eligibilityResult.isEligible) {
        results.eligibleUsers.push({
          ...userProfile,
          eligibleSchemes: [eligibilityResult.schemeDetails],
        });
      } else {
        // Convert reasons to simple strings
        const reasonStrings = eligibilityResult.reasons.map((reason) => {
          if (typeof reason === "string") {
            return reason;
          } else if (typeof reason === "object") {
            return `${reason.type}: ${reason.reason} (${reason.description})`;
          }
          return "Not eligible";
        });

        results.ineligibleUsers.push({
          ...userProfile,
          reasons: reasonStrings,
        });
      }
    }

    return results;
  }
}

module.exports = new EligibilityService();
