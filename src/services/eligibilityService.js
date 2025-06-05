const {
  checkBenefitEligibility,
} = require("../utils/benefitSchemaEligibility.js");
const logger = require("../utils/logger.js");
class EligibilityService {
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
      // Iterate through each benefit schema
      try {
        const eligibilityEvaluationLogic =
          benefit.eligibilityEvaluationLogic ?? null; // Get custom evaluation logic if provided
        const benefitCriteria = benefit.eligibility; /// Get eligibility criteria from the benefit schema
        const eligibilityResult = await checkBenefitEligibility(
          // Check eligibility using the utility function
          userProfile,
          benefitCriteria,
          eligibilityEvaluationLogic,
          strictChecking
        );

        if (eligibilityResult.isEligible) {
          // If user is eligible, add to eligible results
          results.eligible.push({
            schemaId: benefit.id,
            details: eligibilityResult,
          });
        } else {
          // If user is ineligible, add to ineligible results
          results.ineligible.push({
            schemaId: benefit.id,
            details: eligibilityResult,
          });
        }
      } catch (error) {
        results.errors.push({
          // If an error occurs, log it and add to errors
          schemaId: benefit.id || "Unknown",
          error: error.message,
        });
        logger.error("Error in checkBenefitsEligibility:", error);
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
      // Iterate through each user profile
      try {
        const eligibilityEvaluationLogic =
          benefit.eligibilityEvaluationLogic ?? null; // Get custom evaluation logic if provided
        const benefitCriteria = benefit.eligibility; // Get eligibility criteria from the benefit schema
        const eligibilityResult = await checkBenefitEligibility(
          // Check eligibility using the utility function
          userProfile,
          benefitCriteria,
          eligibilityEvaluationLogic,
          strictChecking
        );
        if (eligibilityResult.isEligible) {
          // If user is eligible, add to eligible results
          results.eligibleUsers.push({
            applicationId: userProfile.applicationId,

            details: eligibilityResult,
          });
        } else {
          // If user is ineligible, add to ineligible results
          results.ineligibleUsers.push({
            applicationId: userProfile.applicationId,

            details: eligibilityResult,
          });
        }
      } catch (error) {
        results.errors.push({
          applicationId: userProfile.applicationId || "Unknown",
          error: error.message,
        });
        logger.error("Error in checkUsersEligibility:", error);
      }
    }

    return results;
  }
}

module.exports = new EligibilityService();
