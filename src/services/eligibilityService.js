const Ajv = require('ajv');
const ajv = new Ajv();
require('ajv-formats')(ajv);

class EligibilityService {
  constructor() {
    this.validators = new Map();
    this.initializeSchemaValidator();
  }

  initializeSchemaValidator() {
    const benefitSchema = {
      type: 'object',
      required: ['en'],
      properties: {
        en: {
          type: 'object',
          required: [ 'eligibility'],
          properties: {
            // basicDetails: {
            //   type: 'object',
            //   required: ['title', 'category', 'subCategory', 'tags', 'applicationOpenDate', 'applicationCloseDate'],
            //   properties: {
            //     title: { type: 'string' },
            //     category: { type: 'string' },
            //     subCategory: { type: 'string' },
            //     tags: { type: 'array', items: { type: 'string' } },
            //     applicationOpenDate: { type: 'string', format: 'date' },
            //     applicationCloseDate: { type: 'string', format: 'date' }
            //   }
            // },
            // benefitContent: {
            //   type: 'object',
            //   required: ['shortDescription', 'longDescription', 'benefits'],
            //   properties: {
            //     shortDescription: { type: 'string' },
            //     longDescription: { type: 'string' },
            //     benefits: {
            //       type: 'array',
            //       items: {
            //         type: 'object',
            //         required: ['type', 'title', 'description'],
            //         properties: {
            //           type: { type: 'string', enum: ['financial', 'non-monetary'] },
            //           title: { type: 'string' },
            //           description: { type: 'string' }
            //         }
            //       }
            //     },
            //     amount: { type: 'number' }
            //   }
            // },
            eligibility: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type', 'description', 'criteria'],
                properties: {
                  type: { type: 'string', enum: ['personal', 'educational', 'economical', 'geographical'] },
                  description: { type: 'string' },
                  criteria: {
                    type: 'object',
                    required: ['name', 'condition', 'conditionValues'],
                    properties: {
                      name: { type: 'string' },
                      condition: { type: 'string', enum: ['equals', 'in', 'greater than equals', 'less than equals'] },
                      conditionValues: { 
                        oneOf: [
                          { 
                            type: 'string',
                            description: 'Single string or numeric value for comparison'
                          },
                          { 
                            type: 'array',
                            items: { 
                              type: 'string'
                            },
                            minItems: 1,
                            description: 'Array of values for list comparison'
                          }
                        ],
                        description: 'Value(s) to compare against'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    this.schemaValidator = ajv.compile(benefitSchema);
  }

  validateBenefitSchema(schema) {
    const isValid = this.schemaValidator(schema);
    if (!isValid) {
      return {
        isValid: false,
        errors: this.schemaValidator.errors
      };
    }
    return { isValid: true };
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
      errors: []
    };

    for (const schema of benefitSchemas) {
      try {
        // Validate schema structure
        const validationResult = this.validateBenefitSchema(schema);
        if (!validationResult.isValid) {
          results.errors.push({
            schemaId: schema.id || 'Unknown',
            error: 'Invalid schema structure',
            details: validationResult.errors
          });
          continue;
        }

        // Get the English version of the schema
        const enSchema = schema.en;
        if (!enSchema) {
          throw new Error('Schema must contain an "en" property');
        }

        const eligibilityResult = await this.checkSchemaEligibility(
          userProfile,
          enSchema,
          customRules
        );

        if (eligibilityResult.isEligible) {
          results.eligible.push({
            schemaId: schema.id,
            // details: {
            //   title: enSchema.basicDetails.title,
              // category: enSchema.basicDetails.category,
              // subCategory: enSchema.basicDetails.subCategory,
              // tags: enSchema.basicDetails.tags || [],
              // applicationOpenDate: enSchema.basicDetails.applicationOpenDate,
              // applicationCloseDate: enSchema.basicDetails.applicationCloseDate
            // },
            // benefits: {
            //   shortDescription: enSchema.benefitContent.shortDescription || '',
            //   longDescription: enSchema.benefitContent.longDescription || '',
            //   benefits: enSchema.benefitContent.benefits || [],
            //   amount: enSchema.benefitContent.amount || 0
            // }
          });
        } else {
          results.ineligible.push({
            schemaId: schema.id,
            // details: {
              // title: enSchema.basicDetails.title,
              // category: enSchema.basicDetails.category,
              // subCategory: enSchema.basicDetails.subCategory,
              // tags: enSchema.basicDetails.tags || [],
              // applicationOpenDate: enSchema.basicDetails.applicationOpenDate,
              // applicationCloseDate: enSchema.basicDetails.applicationCloseDate
            // },
            reasons: eligibilityResult.reasons
          });
        }
      } catch (error) {
        results.errors.push({
          schemaId: schema.id || 'Unknown',
          error: error.message
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
        reason: null
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
            reason: `Missing required document: ${documentType}`
          };
        }

        const userDocument = userProfile.documents[documentType];
        
        // Check if the document type is allowed
        if (!allowedProofs.includes(userDocument.type)) {
          return {
            isValid: false,
            reason: `Invalid document type for ${documentType}. Allowed types: ${allowedProofs.join(', ')}`
          };
        }

        // Validate document using VC checker
        const isValid = await this.validateDocument(userDocument);
        if (!isValid) {
          return {
            isValid: false,
            reason: `Invalid document: ${documentType}`
          };
        }
      }
    }

    return {
      isValid: true,
      reason: null
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
      console.error('Error validating document:', error);
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
  async checkSchemaEligibility(userProfile, schema, customRules) {
    if (!schema.eligibility || !Array.isArray(schema.eligibility)) {
      return {
        isEligible: false,
        reasons: ['No eligibility criteria defined in schema']
      };
    }

    const reasons = [];

    // Check application dates first
    // const currentDate = new Date();
    // const openDate = new Date(schema.basicDetails.applicationOpenDate);
    // const closeDate = new Date(schema.basicDetails.applicationCloseDate);

    // if (currentDate < openDate) {
    //   reasons.push({
    //     type: "application",
    //     field: "applicationOpenDate",
    //     reason: "Application period not started",
    //     description: `Application opens on: ${schema.basicDetails.applicationOpenDate}`,
    //     currentDate: currentDate.toISOString().split('T')[0]
    //   });
    // } else if (currentDate > closeDate) {
    //   reasons.push({
    //     type: "application",
    //     field: "applicationCloseDate",
    //     reason: "Application period closed",
    //     description: `Application closed on: ${schema.basicDetails.applicationCloseDate}`,
    //     currentDate: currentDate.toISOString().split('T')[0]
    //   });
    // }

    // Only check other criteria if within application period
    if (reasons.length === 0) {
      // Check each eligibility criterion
      for (const criterion of schema.eligibility) {
        const { type, description, criteria } = criterion;
        const { name, condition, conditionValues } = criteria;

        // Get user value for the criterion
        const userValue = userProfile[name];
        if (userValue === undefined) {
          reasons.push({
            type: type,
            field: name,
            reason: `Missing required field: ${name}`,
            description: description
          });
          continue;
        }

        // Check document requirements if specified
        if (criterion.allowedProofs) {
          const hasValidDocument = await this.checkDocumentValidity(userProfile, criterion);
          if (!hasValidDocument) {
            reasons.push({
              type: type,
              field: name,
              reason: `Missing or invalid document for: ${description}`,
              description: description,
              requiredDocuments: criterion.allowedProofs
            });
            continue;
          }
        }

        // Apply the condition check
        const isEligible = await this.checkCriterion(userValue, condition, conditionValues);
        if (!isEligible) {
          reasons.push({
            type: type,
            field: name,
            reason: `Does not meet ${type} criteria: ${description}`,
            description: description,
            userValue: userValue,
            requiredValue: conditionValues,
            condition: condition
          });
        }
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons: reasons.length > 0 ? reasons : null
    };
  }

  /**
   * Check a single criterion against user value
   * @param {*} userValue - User's value for the criterion
   * @param {string} condition - Condition to check
   * @param {*} conditionValues - Values to compare against
   * @returns {boolean} Whether criterion is met
   */
  async checkCriterion(userValue, condition, conditionValues) {
    // Handle undefined or null condition
    if (!condition) {
      console.error('Invalid condition:', { condition, conditionValues });
      throw new Error('Condition is required for eligibility check');
    }

    // Extract condition string from object if needed
    let conditionStr;
    if (typeof condition === 'object') {
      if (condition.condition) {
        conditionStr = condition.condition;
      } else if (condition.criteria && condition.criteria.condition) {
        conditionStr = condition.criteria.condition;
      } else {
        console.error('Invalid condition object:', condition);
        throw new Error('Invalid condition object structure');
      }
    } else {
      conditionStr = condition;
    }

    // Validate condition string
    if (typeof conditionStr !== 'string') {
      console.error('Invalid condition type:', { conditionStr, type: typeof conditionStr });
      throw new Error('Condition must be a string');
    }

    // Normalize condition string
    conditionStr = conditionStr.toLowerCase().trim();
    
    switch (conditionStr) {
      case 'equals':
        return userValue === conditionValues;
      case 'in':
        return Array.isArray(conditionValues) && conditionValues.includes(userValue);
      case 'greater than equals':
      case 'greater_than_equals':
        return Number(userValue) >= Number(conditionValues);
      case 'less than equals':
      case 'less_than_equals':
        return Number(userValue) <= Number(conditionValues);
      case 'between':
        if (!Array.isArray(conditionValues) || conditionValues.length !== 2) {
          throw new Error('Between condition requires an array of two values');
        }
        const [min, max] = conditionValues.map(Number);
        const value = Number(userValue);
        return value >= min && value <= max;
      default:
        console.error('Unsupported condition:', { conditionStr, conditionValues });
        throw new Error(`Unsupported condition: ${conditionStr}`);
    }
  }

  /**
   * Apply custom rule to user value
   * @param {*} userValue - User's value for the criterion
   * @param {Object} rule - Custom rule object
   * @returns {Boolean} Whether rule is satisfied
   */
  applyCustomRule(userValue, rule) {
    if (!rule.condition || !rule.value) {
      throw new Error('Custom rule must have condition and value properties');
    }

    const value = Number(userValue);
    const ruleValue = Number(rule.value);

    switch (rule.condition) {
      case 'equals':
        return value === ruleValue;
      case 'not equals':
        return value !== ruleValue;
      case 'greater than':
        return value > ruleValue;
      case 'less than':
        return value < ruleValue;
      case 'greater than equals':
        return value >= ruleValue;
      case 'less than equals':
        return value <= ruleValue;
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(userValue);
      case 'not in':
        return Array.isArray(rule.value) && !rule.value.includes(userValue);
      default:
        throw new Error(`Unsupported custom condition: ${rule.condition}`);
    }
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

    // Check application dates first
    // const currentDate = new Date();
    // const openDate = new Date(enSchema.basicDetails.applicationOpenDate);
    // const closeDate = new Date(enSchema.basicDetails.applicationCloseDate);

    // if (currentDate < openDate) {
    //   reasons.push(`Application period not started. Application opens on: ${enSchema.basicDetails.applicationOpenDate}`);
    // } else if (currentDate > closeDate) {
    //   reasons.push(`Application period closed. Application closed on: ${enSchema.basicDetails.applicationCloseDate}`);
    // }

    // Only check other criteria if within application period
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
          const hasValidDocument = await this.checkDocumentValidity(userProfile, criterion);
          if (!hasValidDocument) {
            reasons.push(`Missing or invalid document for: ${description}`);
            continue;
          }
        }

        // Apply the condition check
        const isEligible = await this.checkCriterion(userValue, condition, conditionValues);
        if (!isEligible) {
          let reason = `Does not meet ${type} criteria: ${description}`;
          if (condition === 'in') {
            reason += ` (Required: ${conditionValues.join(', ')}, Got: ${userValue})`;
          } else if (condition === 'less than equals' || condition === 'less_than_equals') {
            reason += ` (Required: <= ${conditionValues}, Got: ${userValue})`;
          } else if (condition === 'greater than equals' || condition === 'greater_than_equals') {
            reason += ` (Required: >= ${conditionValues}, Got: ${userValue})`;
          } else if (condition === 'equals') {
            reason += ` (Required: ${conditionValues}, Got: ${userValue})`;
          }
          reasons.push(reason);
        }
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons: reasons,
      // schemeDetails: {
      //   id: scheme.id,
      //   title: enSchema.basicDetails.title,
      //   category: enSchema.basicDetails.category,
      //   subCategory: enSchema.basicDetails.subCategory,
      //   applicationOpenDate: enSchema.basicDetails.applicationOpenDate,
      //   applicationCloseDate: enSchema.basicDetails.applicationCloseDate
      // }
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
      ineligibleUsers: []
    };

    for (const userProfile of userProfiles) {
      const eligibilityResult = await this.checkUserEligibility(userProfile, scheme);
     
      if (eligibilityResult.isEligible) {
        results.eligibleUsers.push({
          ...userProfile,
          eligibleSchemes: [eligibilityResult.schemeDetails]
        });
      } else {
       
        // Convert reasons to simple strings
        const reasonStrings = eligibilityResult.reasons.map(reason => {
          if (typeof reason === 'string') {
            return reason;
          } else if (typeof reason === 'object') {
            return `${reason.type}: ${reason.reason} (${reason.description})`;
          }
          return 'Not eligible';
        });

        results.ineligibleUsers.push({
          ...userProfile,
          reasons: reasonStrings
        });
      }
    }

    return results;
  }
}

module.exports = new EligibilityService(); 