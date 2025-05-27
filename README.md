# Benefit Eligibility SDK

A Node.js-based SDK for processing benefit eligibility based on user profiles and benefit schemas.

## Features

- Process user profiles against benefit schemas
- Validate input data using JSON Schema
- Support for custom eligibility rules
- RESTful API using Fastify
- Swagger documentation
- Comprehensive error handling

## Installation

```bash
npm install
```

## Usage

### Starting the Server

```bash
npm start
```

The server will start on port 3000 by default.

### API Endpoints

#### Health Check
```
GET /health
```

#### Check Eligibility
```
POST /check-eligibility
```

Request Body:
```json
{
  "userProfile": {
    "name": "John Doe",
    "gender": "Male",
    "age": 28,
    "dateOfBirth": "1997-05-15",
    "caste": "sc",
    "income": 100000
  },
  "benefitSchemas": [
    {
      "en": {
        "basicDetails": {
          "title": "Example Scholarship",
          "category": "education",
          "subCategory": "scholarship"
        },
        "eligibility": [
          {
            "type": "personal",
            "description": "Age must be between 18 and 30",
            "criteria": {
              "name": "age",
              "condition": "greater than equals",
              "conditionValues": "18"
            }
          }
        ]
      }
    }
  ],
  "customRules": {
    "age": (value) => value >= 18 && value <= 30
  }
}
```

Response:
```json
{
  "eligible": [
    {
      "schemaId": "Example Scholarship",
      "details": {
        "title": "Example Scholarship",
        "category": "education",
        "subCategory": "scholarship"
      },
      "benefits": {
        "type": "financial",
        "title": "Scholarship Amount",
        "description": "Annual scholarship of 50000"
      }
    }
  ],
  "ineligible": [],
  "errors": []
}
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## API Documentation

Swagger documentation is available at `/documentation` when the server is running.

## Error Handling

The SDK provides comprehensive error handling for:
- Invalid input data
- Missing required fields
- Schema validation errors
- Custom rule errors

## License

MIT 