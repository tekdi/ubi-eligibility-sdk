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
  origin: "*"
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
    request.log.error(
      { validation: error.validation },
      "Schema validation failed"
    );

    return reply.status(400).send({
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
  "/check-eligibility",
  {
    schema: {
      ...benefitEligibleSchema,
      querystring: {
        type: "object",
        properties: {
          strictChecking: {
            type: "string",
            enum: ["true", "false"],
            default: "false",
            description: "Enable strict eligibility checking"
          }
        },
        additionalProperties: false
      }
    }
  },
  async (request, reply) => {
    try {
      const strictChecking = request.query.strictChecking === "true";
      const { userProfile, benefitsList } = request.body;

      // Process eligibility
      const results = await eligibilityService.checkBenefitsEligibility(
        userProfile,
        benefitsList,
        strictChecking
      );

      return results;
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: error.message });
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
      const { userProfiles, benefitSchema } = request.body;

      const results = await eligibilityService.checkUsersEligibility(
        userProfiles,
        benefitSchema
      );

      return results;
    } catch (error) {
      request.log.error(error);
      reply.code(400).send({ error: error.message });
    }
  }
);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.ready();
    await fastify.listen({ port: port, host: "0.0.0.0" });
    fastify.log.info(`Server is running on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
