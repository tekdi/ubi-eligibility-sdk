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
  methods: ["GET", "POST", "PUT", "DELETE"],
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
      description: "Returns the health status of the API",
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
    schema: benefitEligibleSchema,
  },
  async (request, reply) => {
    try {
      const strictChecking = request.query.strictChecking === "true";
      const { userProfile, benefitSchemas, customRules } = request.body;
      // Process eligibility
      const results = await eligibilityService.checkEligibility(
        userProfile,
        benefitSchemas,
        strictChecking
      );

      return results;
    } catch (error) {
      fastify.log.error(error);
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

      // if (!userProfiles || !benefitSchema) {
      //   throw new Error("User profiles and benefit schema are required");
      // }

      // // Validate user profiles
      // for (const profile of userProfiles) {
      //   const validation = validationService.validateUserProfile(
      //     profile,
      //     userProfileSchema
      //   );
      //   if (!validation.isValid) {
      //     return reply.code(400).send({
      //       error: "Invalid user profile",
      //       details: validation.errors,
      //     });
      //   }
      // }

      // // Validate benefit schema
      // const schemaValidation =
      //   validationService.validateBenefitSchema(benefitSchema);
      // if (!schemaValidation.isValid) {
      //   return reply.code(400).send({
      //     error: "Invalid benefit schema",
      //     details: schemaValidation.errors,
      //   });
      // }

      // Check eligibility for each user
      const results = await eligibilityService.checkUsersEligibility(
        userProfiles,
        benefitSchema
      );

      return results;
    } catch (error) {
      fastify.log.error(error);
      reply.code(400).send({ error: error.message });
    }
  }
);

// Start server
const start = async () => {
  try {
    await fastify.ready();
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info(`Server is running on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
