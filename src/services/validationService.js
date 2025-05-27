const Ajv = require("ajv");
const ajv = new Ajv();
require("ajv-formats")(ajv);

class ValidationService {
  constructor() {
    this.validators = new Map();
  }

  /**
   * Validate user profile against schema
   * @param {Object} userProfile - User profile data
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  validateUserProfile(userProfile, schema) {
    const validator = this.getValidator("userProfile", schema);
    const valid = validator(userProfile);

    if (!valid) {
      return {
        isValid: false,
        errors: validator.errors,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate benefit schema
   * @param {Object} schema - Benefit schema
   * @returns {Object} Validation result
   */
  validateBenefitSchema(schema) {
    const validator = this.getValidator(
      "benefitSchema",
      this.getBenefitSchemaSchema(),
    );
    const valid = validator(schema);

    if (!valid) {
      return {
        isValid: false,
        errors: validator.errors,
      };
    }

    return { isValid: true };
  }

  /**
   * Get or create validator for a schema
   * @param {String} key - Validator key
   * @param {Object} schema - Validation schema
   * @returns {Function} Validator function
   */
  getValidator(key, schema) {
    if (!this.validators.has(key)) {
      const validator = ajv.compile(schema);
      this.validators.set(key, validator);
    }
    return this.validators.get(key);
  }

  /**
   * Get the schema for validating benefit schemas
   * @returns {Object} Schema definition
   */
  getBenefitSchemaSchema() {
    return {
      type: "object",
      required: ["en"],
      properties: {
        en: {
          type: "object",
          required: ["eligibility"],
          properties: {
            eligibility: {
              type: "array",
              items: {
                type: "object",
                required: ["type", "description", "criteria"],
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  criteria: {
                    type: "object",
                    required: ["name", "condition", "conditionValues"],
                    properties: {
                      name: { type: "string" },
                      condition: { type: "string" },
                      conditionValues: {
                        anyOf: [
                          {
                            type: "string",
                            description:
                              "Single string or numeric value for comparison",
                          },
                          {
                            type: "number",
                            description: "Single numeric value for comparison",
                          },
                          {
                            type: "array",
                            items: {
                              anyOf: [{ type: "string" }, { type: "number" }],
                            },
                            minItems: 1,
                            description: "Array of values for list comparison",
                          },
                        ],
                        description: "Value(s) to compare against",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }
}

module.exports = new ValidationService();
