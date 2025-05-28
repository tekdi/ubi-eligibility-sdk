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
      enum: ["sc", "st", "obc", "general"],
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
    required: ["userProfile", "benefitSchemas"],
    properties: {
      userProfile: userProfileSchema,
      benefitSchemas: {
        type: "array",
        items: {
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
                            type: ["string", "number", "array"],
                          },
                        },
                      },
                    },
                  },
                },
              // },
            
          },     
        },
       
      },
      
     customRules: {
        type: "string",
        additionalProperties: true,
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

              reasons: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    field: { type: "string" },
                    reason: { type: "string" },
                    description: { type: "string" },
                    userValue: { type: ["string", "number"] },
                    requiredValue: { type: ["string", "number", "array"] },
                    condition: { type: "string" },
                  },
                },
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

module.exports = benefitEligibleSchema;
