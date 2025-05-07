require('dotenv').config();

const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Benefit Eligibility API',
    description: 'API for checking eligibility of users for various benefit schemes',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: process.env.DEV_SERVER_URL || 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: process.env.STAGING_SERVER_URL || 'https://staging-api.example.com',
      description: 'Staging server'
    },
    {
      url: process.env.PROD_SERVER_URL || 'https://api.example.com',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Eligibility',
      description: 'Endpoints for checking eligibility'
    },
    {
      name: 'System',
      description: 'System related endpoints'
    }
  ],
  components: {
    schemas: {
      UserProfile: {
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
      },
      BenefitSchema: {
        type: 'object',
        required: ['en','id'],
        properties: {
          id: { type: 'string', description: 'ID of the benefit scheme' },
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
                    type: { type: 'string', enum: ['personal', 'educational', 'economical', 'geographical'], description: 'Type of eligibility criterion' },
                    description: { type: 'string', description: 'Description of the eligibility criterion' },
                    criteria: {
                      type: 'object',
                      required: ['name', 'condition', 'conditionValues'],
                      properties: {
                        name: { type: 'string', description: 'Name of the criterion field' },
                        condition: { type: 'string', enum: ['equals', 'in', 'greater than equals', 'less than equals', 'between'], description: 'Condition to check' },
                        conditionValues: { 
                          oneOf: [
                            { type: 'string' },
                            { type: 'number' },
                            { type: 'array', items: { type: ['string', 'number'] } }
                          ],
                          description: 'Value(s) to compare against'
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
      },
      EligibilityResponse: {
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
      CheckEligibilityResponse: {
        type: 'object',
        properties: {
          eligible: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                schemaId: { type: 'string', description: 'ID of the eligible benefit scheme' },
              }
            }
          },
          ineligible: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                schemaId: { type: 'string', description: 'ID of the ineligible benefit scheme' },
                reasons: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of reasons why the user is ineligible'
                }
              }
            }
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                schemaId: { type: 'string', description: 'ID of the schema with error' },
                error: { type: 'string', description: 'Error message' }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/check-eligibility': {
      post: {
        tags: ['Eligibility'],
        summary: 'Check eligibility for a single user against multiple benefit schemes',
        description: 'Checks if a user is eligible for multiple benefit schemes and returns detailed reasons for ineligibility',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userProfile', 'benefitSchemas'],
                properties: {
                  userProfile: { $ref: '#/components/schemas/UserProfile' },
                  benefitSchemas: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/BenefitSchema' }
                  },
                  customRules: {
                    type: 'object',
                    description: 'Custom rules to override standard eligibility checks',
                    additionalProperties: true
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CheckEligibilityResponse' }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', description: 'Error message' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/check-users-eligibility': {
      post: {
        tags: ['Eligibility'],
        summary: 'Check eligibility of multiple users for a benefit scheme',
        description: 'Checks if multiple users are eligible for a specific benefit scheme and returns detailed reasons for ineligibility',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userProfiles', 'benefitSchema'],
                properties: {
                  userProfiles: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/UyserProfile' }
                  },
                  benefitSchema: { $ref: '#/components/schemas/BenefitSchema' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EligibilityResponse' }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', description: 'Error message' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check endpoint',
        description: 'Returns the health status of the API',
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
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
          }
        }
      }
    }
  }
};

module.exports = swaggerConfig; 