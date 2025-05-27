 const { checkCriterion, applyCustomRule } = require("./eligibilityUtils");
 /**
   * Check eligibility for a single benefit schema
   * @param {Object} userProfile - User profile data
   * @param {Object} schema - Benefit schema
   * @param {Object} customRules - Custom rules
   * @returns {Object} Whether user is eligible and reasons for ineligibility
   */

async function checkSchemaEligibility(userProfile, schema, customRules) {
    // checkBenefit
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
        const {
          name,
          condition,
          conditionValues,
          documentKey,
          strictChecking,
        } = criteria;

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
          conditionValues
        );
        // console.log(isEligible,'====-----======')
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
          const hasValidDocument = await checkDocumentValidity(
            userProfile,
            criterion
          );
          if (!hasValidDocument) {
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
   * Check document validity using VC checker
   * @param {Object} userProfile - User profile data
   * @param {Object} schema - Benefit schema
   * @returns {Object} Whether documents are valid
   */
  async function checkDocumentValidity(userProfile, schema) {
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
        const isValid = await validateDocument(userDocument);
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
  async function validateDocument(document) {
    try {
      // TODO: Implement actual VC checker integration
      // For now, we'll just check if the document is verified
      return document.verified === true;
    } catch (error) {
      console.error("Error validating document:", error);
      return false;
    }
  }

  module.exports = {
    checkSchemaEligibility,
    checkDocumentValidity,
    validateDocument
  }

