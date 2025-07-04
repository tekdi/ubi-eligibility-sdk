// Define schemas
const userProfileSchema = {
  type: "object",
  required: ["name", "gender", "age", "dateOfBirth", "caste", "income"],
  properties: {
    name: { type: "string", description: "Full name of the user" },
    gender: {
      type: "string",
      description: "Gender of the user",
      enum: ["male", "female"],
    },
    age: { type: "number", description: "Age of the user" },
    dateOfBirth: {
      type: "string",
      format: "date",
      description: "Date of birth in YYYY-MM-DD format",
    },
    caste: {
      type: "string",
      description: "Caste category",
      enum: [
        "sc",
        "st",
        "obc",
        "general",
        "ews",
        "bc",
        "mbc",
        "nt",
        "vjan",
        "dnt",
        "sbc",
        "other",
      ],
    },
    income: { type: "number", description: "Annual income in INR" },
  },
};

const benefitEligibleSchema = {
  tags: ["Eligibility"],
  summary: "Check eligibility for benefits",
  description: "Checks if a user is eligible for all available benefit schemes",
  body: {
    type: "object",
    required: ["userProfile", "benefitsList"],
    properties: {
      userProfile: userProfileSchema,
      benefitsList: {
        type: "array",
        items: {
          type: "object",
          required: ["eligibility"],
          properties: {
            eligibility: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "type", "description", "criteria"],
                properties: {
                  id: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" },
                  criteria: {
                    type: "object",
                    required: ["name", "condition", "conditionValues"],
                    properties: {
                      name: { type: "string" },
                      condition: { type: "string" },
                      conditionValues: {
                        type: ["string", "number", "array"],
                      },
                    },
                  },
                },
              },
            },
            // },
            eligibilityEvaluationLogic: {
              type: "string",
              additionalProperties: true,
            },
          },
        },
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        eligible: {
          type: "array",
          items: {
            type: "object",
            properties: {
              schemaId: {
                type: "string",
                description: "ID of the eligible benefit scheme",
              },
              details: {
                type: "object",
                description: "Additional eligibility details or messages",
                additionalProperties: true,
              },
            },
          },
        },
        ineligible: {
          type: "array",
          items: {
            type: "object",
            properties: {
              schemaId: {
                type: "string",
                description: "ID of the ineligible benefit scheme",
              },
              details: {
                type: "object",
                description: "Additional eligibility details or messages",
                additionalProperties: true,
              },
            },
          },
        },
        errors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              schemaId: { type: "string" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    400: {
      type: "object",
      properties: {
        error: {
          type: "string",
          description: "Error message",
        },
        message: { type: "string", description: "Detailed error message" },
      },
    },
    500: {
      type: "object",
      properties: {
        error: {
          type: "string",
          description: "Error message",
        },
        message: { type: "string", description: "Detailed error message" },
      },
    },
  },
};

module.exports = { benefitEligibleSchema, userProfileSchema };
