require("dotenv").config();
const {benefitEligibleSchema, userProfileSchema} = require("../schemas/check-eligibility-schema.js");
const {userEligibilitySchema, benefitSchema} = require("../schemas/check-users-eligibility-schema.js");
const swaggerConfig = {
  openapi: "3.0.0",
  info: {
    title: "Benefit Eligibility API",
    description:
      "API for checking eligibility of users for various benefit schemes",
    version: "1.0.0",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
  },
  servers: [
    {
      url: process.env.DEV_SERVER_URL || "http://localhost:3000",
      description: "Development server",
    },
    {
      url: process.env.STAGING_SERVER_URL || "https://staging-api.example.com",
      description: "Staging server",
    },
    {
      url: process.env.PROD_SERVER_URL || "https://api.example.com",
      description: "Production server",
    },
  ],
  tags: [
    {
      name: "Eligibility",
      description: "Endpoints for checking eligibility",
    },
    {
      name: "System",
      description: "System related endpoints",
    },
  ],
  components: {
    schemas: {
      UserProfile: userProfileSchema,
      BenefitSchema: benefitSchema,
      EligibilityResponse: benefitEligibleSchema.response[200],
      EligibilityResponseBad: benefitEligibleSchema.response[400],
      CheckEligibilityResponse: userEligibilitySchema.response[200],
      CheckEligibilityResponseBad: userEligibilitySchema.response[400],
    },
  },
  paths: {
    "/check-eligibility": {
      post: {
        tags: ["Eligibility"],
        summary:
          "Check eligibility for a single user against multiple benefit schemes",
        description:
          "Checks if a user is eligible for multiple benefit schemes and returns detailed reasons for ineligibility",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userProfile", "benefitSchemas"],
                properties: {
                  userProfile: { $ref: "#/components/schemas/UserProfile" },
                  benefitSchemas: {
                    type: "array",
                    items: { $ref: "#/components/schemas/BenefitSchema" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/EligibilityResponse",
                },
              },
            },
          },
          400: {
            description: "Bad request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/EligibilityResponseBad",
                },
              },
            },
          },
        },
      },
    },
    "/check-users-eligibility": {
      post: {
        tags: ["Eligibility"],
        summary: "Check eligibility of multiple users for a benefit scheme",
        description:
          "Checks if multiple users are eligible for a specific benefit scheme and returns detailed reasons for ineligibility",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userProfiles", "benefitSchema"],
                properties: {
                  userProfiles: {
                    type: "array",
                    items: { $ref: "#/components/schemas/UserProfile" },
                  },
                  benefitSchema: { $ref: "#/components/schemas/BenefitSchema" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckEligibilityResponse" },
              },
            },
          },
          400: {
            description: "Bad request",
            content: {
              "application/json": {
                  schema: { $ref: "#/components/schemas/CheckEligibilityResponseBad" },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check endpoint",
        description: "Returns the health status of the API",
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["ok"],
                      description: "Health status",
                    },
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

module.exports = swaggerConfig;
