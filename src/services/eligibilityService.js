const { checkCriterion, applyCustomRule } = require("../utils/eligibilityUtils");
class EligibilityService {
  constructor() {
    
  }


  /**
   * Check eligibility for all provided benefit schemas
   * @param {Object} userProfile - User profile data
   * @param {Array} benefitSchemas - Array of benefit schemas
   * @param {Object} customRules - Optional custom rules
   * @returns {Object} Eligibility results
   */
  async checkEligibility(userProfile, benefitSchemas, customRules = {}) {
    const results = {
      eligible: [],
      ineligible: [],
      errors: [],
    };

    for (const schema of benefitSchemas) {
      try {
        const benefitCrateria = schema.eligibility;
       

        const eligibilityResult = await this.checkSchemaEligibility(
          userProfile,
          benefitCrateria,
          customRules,
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
   * Check document validity using VC checker
   * @param {Object} userProfile - User profile data
   * @param {Object} schema - Benefit schema
   * @returns {Object} Whether documents are valid
   */
  async checkDocumentValidity(userProfile, schema) {
    // Get document requirements from the scheme
    const documentRequirements = schema.documents || [];

    // If no document requirements, return true
    if (documentRequirements.length === 0) {
      return {
        isValid: true,
        reason: null,
      };
    }

    // Check each required document
    for (const requirement of documentRequirements) {
      const { documentType, isRequired, allowedProofs } = requirement;

      if (isRequired) {
        // Check if user has provided the required document
        if (!userProfile.documents || !userProfile.documents[documentType]) {
          return {
            isValid: false,
            reason: `Missing required document: ${documentType}`,
          };
        }

        const userDocument = userProfile.documents[documentType];

        // Check if the document type is allowed
        if (!allowedProofs.includes(userDocument.type)) {
          return {
            isValid: false,
            reason: `Invalid document type for ${documentType}. Allowed types: ${allowedProofs.join(", ")}`,
          };
        }

        // Validate document using VC checker
        const isValid = await this.validateDocument(userDocument);
        if (!isValid) {
          return {
            isValid: false,
            reason: `Invalid document: ${documentType}`,
          };
        }
      }
    }

    return {
      isValid: true,
      reason: null,
    };
  }

  /**
   * Validate a document using VC checker
   * @param {Object} document - Document to validate
   * @returns {Boolean} Whether document is valid
   */
  async validateDocument(document) {
    try {
      // TODO: Implement actual VC checker integration
      // For now, we'll just check if the document is verified
      return document.verified === true;
    } catch (error) {
      console.error("Error validating document:", error);
      return false;
    }
  }

  /**
   * Check eligibility for a single benefit schema
   * @param {Object} userProfile - User profile data
   * @param {Object} schema - Benefit schema
   * @param {Object} customRules - Custom rules
   * @returns {Object} Whether user is eligible and reasons for ineligibility
   */
async checkSchemaEligibility(userProfile, schema, customRules) { // checkBenefit
  if (!schema || !Array.isArray(schema)) {
    return {
      isEligible: false,
      reasons: ["No eligibility criteria defined in schema"],
    };
  }

  const reasons = [];

  // Only check other criteria if within application period
  if (reasons.length === 0) {
    // Check each eligibility criterion
    for (const criterion of schema) {
      
      const { type, description, criteria } = criterion;
      const { name, condition, conditionValues, documentKey, strictChecking } = criteria;

      let userValue;
      if (type === "userProfile") {
        userValue = userProfile[name];
        if (!userValue && strictChecking === true) {
          reasons.push({
            type,
            field: name,
            reason: `Missing required userProfile field: ${name}`,
            description,
          });
          continue;
        }
        // Apply the condition check
      } else {
        // For non-personal types, check document exists and valid
        const doc = userProfile.documents?.[documentKey];
        if (!doc && strictChecking === true) {
          reasons.push({
            type,
            field: documentKey,
            reason: `Missing required document: ${documentKey}`,
            description,
          });
          continue;
        }
        userValue = doc?.vc?.[name];
        if (!userValue && strictChecking === true) {
          reasons.push({
            type,
            field: name,
            reason: `Missing required field in vc: ${name}`,
            description,
          });
          continue;
        }
      }

      const isEligible = await checkCriterion(
        userValue,
        condition,
        conditionValues,
      );
      if (!isEligible && strictChecking === true) {
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

      // Check document requirements if specified
      if (criterion.allowedProofs) {
        const hasValidDocument = await this.checkDocumentValidity(
          userProfile,
          criterion,
        );
        if (!hasValidDocument ) {
          reasons.push({
            type: type,
            field: name,
            reason: `Missing or invalid document for: ${description}`,
            description: description,
            requiredDocuments: criterion.allowedProofs,
          });
          continue;
        }
      }
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons: reasons.length > 0 ? reasons : null,
  };
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
          const hasValidDocument = await this.checkDocumentValidity(
            userProfile,
            criterion,
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
          conditionValues,
        );
        if (!isEligible) {
          let reason = `Does not meet ${type} criteria: ${description}`;
          if (condition === "in") {
            reason += ` (Required: ${conditionValues.join(", ")}, Got: ${userValue})`;
          } else if (
            condition === "less than equals" ||
            condition === "less_than_equals"
          ) {
            reason += ` (Required: <= ${conditionValues}, Got: ${userValue})`;
          } else if (
            condition === "greater than equals" ||
            condition === "greater_than_equals"
          ) {
            reason += ` (Required: >= ${conditionValues}, Got: ${userValue})`;
          } else if (condition === "equals") {
            reason += ` (Required: ${conditionValues}, Got: ${userValue})`;
          }
          reasons.push(reason);
        }
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons: reasons
    };
  }

  /**
   * Check document validity for a criterion
   * @param {Object} userProfile - User profile data
   * @param {Object} criterion - Eligibility criterion
   * @returns {boolean} Whether document is valid
   */
  async checkDocumentValidity(userProfile, criterion) {
    const { allowedProofs } = criterion;
    if (!allowedProofs || allowedProofs.length === 0) {
      return true;
    }

    const userDocuments = userProfile.documents || {};
    for (const proofType of allowedProofs) {
      const document = userDocuments[proofType];
      if (document && document.verified) {
        return true;
      }
    }

    return false;
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
        scheme,
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
