const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');
const eligibilityService = require('./services/eligibilityService');
const validationService = require('./services/validationService');
const swaggerConfig = require('./config/swagger');

// Register plugins
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// Define schemas
const userProfileSchema = {
  type: 'object',
  required: ['name', 'gender', 'age', 'dateOfBirth', 'caste', 'income'],
  properties: {
    name: { type: 'string', description: 'Full name of the user' },
    gender: { type: 'string', description: 'Gender of the user', enum: ['male', 'female'] },
    age: { type: 'number', description: 'Age of the user' },
    dateOfBirth: { type: 'string', format: 'date', description: 'Date of birth in YYYY-MM-DD format' },
    caste: { type: 'string', description: 'Caste category', enum: ['sc', 'st', 'obc', 'general'] },
    income: { type: 'number', description: 'Annual income in INR' }
  }
};


// Register Swagger
fastify.register(swagger, {
  openapi: swaggerConfig
});

// Register Swagger UI
fastify.register(swaggerUI, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
});

// Health check route
fastify.get('/health', {
  schema: {
    tags: ['System'],
    summary: 'Health check endpoint',
    description: 'Returns the health status of the API',
    response: {
      200: {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['ok'],
            description: 'Health status'
          }
        }
      }
    }
  }
}, async (request, reply) => {
  return { status: 'ok' };
});

// Main eligibility check endpoint
fastify.post('/check-eligibility', {
  schema: {
    tags: ['Eligibility'],
    summary: 'Check eligibility for benefits',
    description: 'Checks if a user is eligible for all available benefit schemes',
    body: {
      type: 'object',
      required: ['userProfile', 'benefitSchemas', 'customRules'],
      properties: {
        userProfile: userProfileSchema,
        benefitSchemas: {
          type: 'array',
          items: {
            type: 'object',
            required: ['en'],
            properties: {
              en: {
                type: 'object',
                required: ['eligibility'],
                properties: {
                  eligibility: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['type', 'description', 'criteria'],
                      properties: {
                        type: { type: 'string' },
                        description: { type: 'string' },
                        criteria: {
                          type: 'object',
                          required: ['name', 'condition', 'conditionValues'],
                          properties: {
                            name: { type: 'string' },
                            condition: { type: 'string' },
                            conditionValues: { type: ['string', 'number', 'array'] }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        customRules: {
          type: 'object',
          additionalProperties: true,
          description: 'Custom rules to override standard eligibility checks'
        }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          eligible: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                schemaId: { 
                  type: 'string',
                  description: 'ID of the eligible benefit scheme'
                },
              }
            }
          },
          ineligible: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                schemaId: { 
                  type: 'string',
                  description: 'ID of the ineligible benefit scheme'
                },
              
                reasons: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      field: { type: 'string' },
                      reason: { type: 'string' },
                      description: { type: 'string' },
                      userValue: { type: ['string', 'number'] },
                      requiredValue: { type: ['string', 'number', 'array'] },
                      condition: { type: 'string' }
                    }
                  }
                }
              }
            }
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                schemaId: { type: 'string' },
                error: { type: 'string' }
              }
            }
          }
        }
      },
      400: {
        type: 'object',
        properties: {
          error: { 
            type: 'string',
            description: 'Error message'
          }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { userProfile, benefitSchemas, customRules } = request.body;
    
    // Validate required fields
    if (!userProfile) {
      throw new Error('userProfile is required');
    }
    if (!benefitSchemas || !Array.isArray(benefitSchemas)) {
      throw new Error('benefitSchemas must be an array');
    }

    // Process eligibility
    const results = await eligibilityService.checkEligibility(
      userProfile,
      benefitSchemas,
      customRules
    );
    
    return results;
  } catch (error) {
    fastify.log.error(error);
    reply.code(400).send({ error: error.message });
  }
});

// List user profiles for a scheme endpoint
fastify.post('/check-users-eligibility', {
  schema: {
    tags: ['Eligibility'],
    summary: 'Check eligibility of multiple users for a benefit scheme',
    description: 'Checks if multiple users are eligible for a specific benefit scheme and returns detailed reasons for ineligibility',
    body: {
      type: 'object',
      required: ['userProfiles', 'benefitSchema'],
      properties: {
        userProfiles: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'gender', 'age', 'dateOfBirth', 'caste', 'income'],
            properties: {
              name: { type: 'string', description: 'Full name of the user' },
              gender: { type: 'string', enum: ['male', 'female'], description: 'Gender of the user' },
              age: { type: 'number', description: 'Age of the user' },
              dateOfBirth: { type: 'string', format: 'date', description: 'Date of birth in YYYY-MM-DD format' },
              caste: { type: 'string', enum: ['sc', 'st', 'obc', 'general'], description: 'Caste category' },
              income: { type: 'number', description: 'Annual income in INR' },
              documents: {
                type: 'object',
                description: 'User documents with verification status',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    verified: { type: 'boolean', description: 'Whether the document is verified' }
                  }
                }
              }
            }
          }
        },
        benefitSchema: {
          type: 'object',
          required: ['en'],
          properties: {
            en: {
              type: 'object',
              required: [ 'eligibility'],
              properties: {
                eligibility: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['type', 'description', 'criteria'],
                    properties: {
                      type: { type: 'string' },
                      description: { type: 'string' },
                      criteria: {
                        type: 'object',
                        required: ['name', 'condition', 'conditionValues'],
                        properties: {
                          name: { type: 'string' },
                          condition: { type: 'string' },
                          conditionValues: { 
                            anyOf: [
                              { type: 'string' },
                              { type: 'number' },
                              { 
                                type: 'array',
                                items: { 
                                  anyOf: [
                                    { type: 'string' },
                                    { type: 'number' }
                                  ]
                                },
                                minItems: 1
                              }
                            ]
                          }
                        }
                      },
                      allowedProofs: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of allowed document types for verification'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          eligibleUsers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Name of the eligible user' },
                applicationId: { type: 'string', description: 'Application ID of the eligible user' },
               
              }
            }
          },
          ineligibleUsers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Name of the ineligible user' },
                applicationId: { type: 'string', description: 'Application ID of the eligible user' },
                reasons: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of reasons why the user is ineligible'
                }
              }
            }
          }
        }
      },
      400: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Error message' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const { userProfiles, benefitSchema } = request.body;
    
    if (!userProfiles || !benefitSchema) {
      throw new Error('User profiles and benefit schema are required');
    }

    // Validate user profiles
    for (const profile of userProfiles) {
      const validation = validationService.validateUserProfile(profile, userProfileSchema);
      if (!validation.isValid) {
        return reply.code(400).send({ 
          error: 'Invalid user profile',
          details: validation.errors 
        });
      }
    }

    // Validate benefit schema
    const schemaValidation = validationService.validateBenefitSchema(benefitSchema);
    if (!schemaValidation.isValid) {
      return reply.code(400).send({ 
        error: 'Invalid benefit schema',
        details: schemaValidation.errors 
      });
    }

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
});

// Start server
const start = async () => {
  try {
    await fastify.ready();
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info(`Server is running on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 