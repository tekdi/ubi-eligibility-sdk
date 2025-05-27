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

const benefitSchema = {
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
                      { type: "string" },
                      { type: "number" },
                      {
                        type: "array",
                        items: {
                          anyOf: [{ type: "string" }, { type: "number" }],
                        },
                        minItems: 1,
                      },
                    ],
                  },
                },
              },
              allowedProofs: {
                type: "array",
                items: { type: "string" },
                description: "List of allowed document types for verification",
              },
            },
          },
        },
      },
    },
  },
};

const userEligibilitySchema = {
      tags: ["Eligibility"],
      summary: "Check eligibility of multiple users for a benefit scheme",
      description:
        "Checks if multiple users are eligible for a specific benefit scheme and returns detailed reasons for ineligibility",
      body: {
        type: "object",
        required: ["userProfiles", "benefitSchema"],
        properties: {
          userProfiles: {
            type: "array",
            items: {
              type: "object",
              required: [
                "name",
                "gender",
                "age",
                "dateOfBirth",
                "caste",
                "income",
              ],
              properties: {
                name: { type: "string", description: "Full name of the user" },
                gender: {
                  type: "string",
                  enum: ["male", "female"],
                  description: "Gender of the user",
                },
                age: { type: "number", description: "Age of the user" },
                dateOfBirth: {
                  type: "string",
                  format: "date",
                  description: "Date of birth in YYYY-MM-DD format",
                },
                caste: {
                  type: "string",
                  enum: ["sc", "st", "obc", "general"],
                  description: "Caste category",
                },
                income: { type: "number", description: "Annual income in INR" },
                documents: {
                  type: "object",
                  description: "User documents with verification status",
                  additionalProperties: {
                    type: "object",
                    properties: {
                      verified: {
                        type: "boolean",
                        description: "Whether the document is verified",
                      },
                    },
                  },
                },
              },
            },
          },
          benefitSchema: benefitSchema
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            eligibleUsers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name of the eligible user",
                  },
                  applicationId: {
                    type: "string",
                    description: "Application ID of the eligible user",
                  },
                },
              },
            },
            ineligibleUsers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name of the ineligible user",
                  },
                  applicationId: {
                    type: "string",
                    description: "Application ID of the eligible user",
                  },
                  reasons: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of reasons why the user is ineligible",
                  },
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
    }


module.exports = userEligibilitySchema;