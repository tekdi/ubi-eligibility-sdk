const {
  checkBenefiteligibility
} = require("../utils/benefitSchemaEligibility.js");
class EligibilityService {
  constructor() {} 

  /**
   * Check eligibility for all provided benefit schemas
   * @param {Object} userProfile - User profile data
   * @param {Array} benefits - Array of benefit schemas
   * @param {Object} customRules - Optional custom rules
   * @returns {Object} Eligibility results
   */
  async checkEligibility(userProfile, benefits, strictChecking) {
    const results = {
      eligible: [],
      ineligible: [],
      errors: [],
    };

    for (const benefit of benefits) {
      try {
        const customRules = benefit.customRules ?? null;
        const benefitCrateria = benefit.eligibility;
          const eligibilityResult = await checkBenefiteligibility( //checkbenefiteligibility
            userProfile,
            benefitCrateria,
            customRules,
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
        const customRules = benefit.customRules ?? null;
        const benefitCrateria = benefit.eligibility;
          const eligibilityResult = await checkBenefiteligibility(
            userProfile,
            benefitCrateria,
            customRules,
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
