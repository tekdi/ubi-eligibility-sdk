const {
  checkBenefitEligibility
} = require("../utils/benefitSchemaEligibility.js");
class EligibilityService {
  constructor() {} 

  /**
   * Check eligibility for all provided benefit schemas
   * @param {Object} userProfile - User profile data
   * @param {Array} benefits - Array of benefit schemas
   * @param {Object} eligibilityEvaluationLogic - Optional custom rules
   * @returns {Object} Eligibility results
   */
  async checkBenefitsEligibility(userProfile, benefits, strictChecking) {
    const results = {
      eligible: [],
      ineligible: [],
      errors: [],
    };

    for (const benefit of benefits) {
      try {
        const eligibilityEvaluationLogic = benefit.eligibilityEvaluationLogic ?? null;
        const benefitCriteria = benefit.eligibility;
          const eligibilityResult = await checkBenefitEligibility(
            userProfile,
            benefitCriteria,
            eligibilityEvaluationLogic,
            strictChecking
          );

          if (eligibilityResult.isEligible) {
            results.eligible.push({
              schemaId: benefit.id,
              details: eligibilityResult
            });
          } else {
            results.ineligible.push({
              schemaId: benefit.id,
              details: eligibilityResult
            });
          }
      } catch (error) {
        results.errors.push({
          schemaId: benefit.id || "Unknown",
          error: error.message,
        });
      }
    }
    return results;
  }

  /**
   * Check which users are eligible for a specific benefit scheme
   * @param {Array} userProfiles - Array of user profiles
   * @param {Object} scheme - Benefit scheme to check against
   * @returns {Object} List of eligible and ineligible users with reasons
   */
  async checkUsersEligibility(userProfiles, benefit, strictChecking) {
    const results = {
      eligibleUsers: [],
      ineligibleUsers: [],
      errors: [],
    };
       
    for (const userProfile of userProfiles) {
        try {
        const eligibilityEvaluationLogic = benefit.eligibilityEvaluationLogic ?? null;
        const benefitCriteria = benefit.eligibility;
          const eligibilityResult = await checkBenefitEligibility(
            userProfile,
            benefitCriteria,
            eligibilityEvaluationLogic,
            strictChecking
          );
          if (eligibilityResult.isEligible) {
            results.eligibleUsers.push({
              applicationId: userProfile.applicationId,
              name: userProfile.name,
              details: eligibilityResult
            });
          } else {
            results.ineligibleUsers.push({
              applicationId: userProfile.applicationId,
              name: userProfile.name,
              details: eligibilityResult
            });
          }
      } catch (error) {
        results.errors.push({
          applicationId: userProfile.applicationId || "Unknown",
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new EligibilityService();
