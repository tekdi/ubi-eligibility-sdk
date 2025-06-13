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
  (request, reply) => {
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
  return reply.status(error.statusCode || 500).send({ 
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
            type: "boolean",
            default: false,
            description: "Enable strict eligibility checking",
          },
        },
        additionalProperties: false, 
      },
    },
  },
  (request, reply) => {
    const strictChecking = Boolean(request.query.strictChecking);
    const { userProfile, benefitsList } = request.body;

    return eligibilityService.checkBenefitsEligibility(
      userProfile,
      benefitsList,
      strictChecking
    ).catch(error => {
      request.log.error(error);
      return reply.status(error.statusCode ?? 500).send({
        error: "Internal Server Error",
        message: error.message,
      });
    });
  }
);

// List user profiles for a scheme endpoint
fastify.post(
  "/check-users-eligibility",
  {
    schema: {
      ...userEligibilitySchema,
      querystring: { 
        type: "object",
        properties: {
          strictChecking: {
            type: "boolean",
            default: false,
            description: "Enable strict eligibility checking",
          },
        },
        additionalProperties: false, 
      },
    },
  },
  (request, reply) => {
    const strictChecking = Boolean(request.query.strictChecking);
    const { userProfiles, benefitSchema } = request.body;

    // Check if eligibility criteria is an array
    const benefitCriteria = Array.isArray(benefitSchema?.eligibility) 
      ? [...benefitSchema.eligibility]
      : [];

    return eligibilityService.checkUsersEligibility(
      userProfiles,
      { ...benefitSchema, eligibility: benefitCriteria },
      strictChecking
    ).catch(error => {
      request.log.error(error);
      return reply.status(error.statusCode ?? 500).send({
        error: "Internal Server Error",
        message: error.message,
      });
    });
  }
);

// Start server
const start = () => {
  const port = process.env.PORT || 3000;
  
  return fastify.ready()
    .then(() => fastify.listen({ port: port, host: "0.0.0.0" }))
    .then(() => {
      fastify.log.info(`Server is running on ${fastify.server.address().port}`);
    })
    .catch(error => {
      fastify.log.error(error);
      process.exit(1);
    });
};

start();
