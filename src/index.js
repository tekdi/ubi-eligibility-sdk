const fastify = require("fastify")({ logger: true });
const cors = require("@fastify/cors");
const swagger = require("@fastify/swagger");
const swaggerUI = require("@fastify/swagger-ui");
const eligibilityService = require("./services/eligibilityService");
const swaggerConfig = require("./config/swagger");
const benefitEligibleSchema = require("./schemas/check-eligibility-schema");
const userEligibilitySchema = require("./schemas/check-users-eligibility-schema");

// Register plugins
fastify.register(cors, {
  origin: "*",
});

// Register Swagger
fastify.register(swagger, {
  openapi: swaggerConfig,
});

// Register Swagger UI
fastify.register(swaggerUI, {
  routePrefix: "/documentation",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Health check route
fastify.get(
  "/health",
  {
    schema: {
      tags: ["System"],
      summary: "Health check endpoint",
      description: "Returns the health status of Eligibility SDK service",
      response: {
        200: {
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
  async (request, reply) => {
    return { status: "ok" };
  }
);

fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    // This is a validation error (400)
    request.log.error( // Log the error with validation details
      { validation: error.validation },
      "Schema validation failed"
    );

    return reply.status(400).send({ /// Send a 400 Bad Request response
      error: "Bad Request",
      message: error.message,
      details: error.validation,
    });
  }
  request.log.error(error);
  reply.status(error.statusCode || 500).send({ 
    error: "Internal Server Error",
    message: error.message,
  });
});

// Main eligibility check endpoint
fastify.post(
  "/check-eligibility", // beneficiary eligibility endpoint
  {
    schema: { 
      ...benefitEligibleSchema, // Importing the schema for eligibility check
      querystring: { // Query parameters for strict checking
        type: "object",
        properties: {
          strictChecking: {
            type: "string",
            enum: ["true", "false"],
            default: "false",
            description: "Enable strict eligibility checking",
          },
        },
        additionalProperties: false, /// Prevent additional properties in query string
      },
    },
  },
  async (request, reply) => {
    try {
      const strictChecking = request.query.strictChecking === "true"; // Convert query parameter to boolean
      // Extract user profile and benefits list from request body
      const { userProfile, benefitsList } = request.body;

      // process eligibility check using the eligibility service
      const results = eligibilityService.checkBenefitsEligibility(
        userProfile,
        benefitsList,
        strictChecking
      );

      return results;
    } catch (error) {
      request.log.error(error);
      reply.status(error.statusCode ?? 500).send({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// List user profiles for a scheme endpoint
fastify.post(
  "/check-users-eligibility",
  {
    schema: userEligibilitySchema,
  },
  async (request, reply) => {
    try {
      const strictChecking = request.query.strictChecking === "true"; // Convert query parameter to boolean
      const { userProfiles, benefitSchema } = request.body; // Extract user profiles and benefit schema from request body
      let benefitCriteria = Array.isArray(benefitSchema?.eligibility) // Check if eligibility criteria is an array
        ? [...benefitSchema.eligibility]
        : [];
      const results = eligibilityService.checkUsersEligibility(
        userProfiles,
        { ...benefitSchema, eligibility: benefitCriteria }, // Pass the benefit schema with eligibility criteria
        strictChecking
      );

      return results;
    } catch (error) {
      request.log.error(error);
      reply.status(error.statusCode ?? 500).send({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.ready();
    await fastify.listen({ port: port, host: "localhost" });
    fastify.log.info(`Server is running on ${fastify.server.address().port}`);
  } catch (error) {
    // 'request' is not available here, so use fastify.log.error instead
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
