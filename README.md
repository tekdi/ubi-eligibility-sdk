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
    "gender": "male",
    "age": 16,
    "dateOfBirth": "2008-01-01",
    "caste": "sc",
    "income": 400,
    "class": "9",
    "previousYearMarks": 75,
    "state": "Maharastra"
  },
  "benefitsList": [
    {
      "id": "ubi-pilot-scholarship-1",
      "eligibility": [
        {
          "type": "userProfile",
          "id": "B1",
          "description": "The applicant must be from SC or ST or OBC castes",
          "criteria": {
            "documentKey": "casteCertificate",
            "name": "caste",
            "condition": "in",
            "conditionValues": ["sc", "st", "obc"]
          }
        },
        {
          "id": "B3",
          "type": "userProfile",
          "description": "The applicant must be from Rajasthan state",
          "criteria": {
            "documentKey": "incomeCertificate",
            "name": "state",
            "condition": "equals",
            "conditionValues": "Rajasthan"
          }
        }
      ],
      "eligibilityEvaluationLogic": "(B1 && B2) || B3"
    }
  ]
}
```

Response:

```json
{
    "eligible": [
        {
            "schemaId": "ubi-pilot-scholarship-1",
            "details": {
                "isEligible": true,
                "reasons": [
                    "Eligible because custom rule \"(B1 && B2) || B3\" evaluated to true with: {\"B5\":true,\"B4\":true,\"B1\":true,\"B2\":true,\"B3\":false}"
                ],
                "evaluationResults": {
                    "B5": true,
                    "B4": true,
                    "B1": true,
                    "B2": true,
                    "B3": false
                },
                "criteriaResults": [
                    {
                        "ruleKey": "B5",
                        "passed": true,
                        "description": "Gender of Applicant - both male and female allowed to avail scholarship",
                        "reasons": []
                    },
                    {
                        "ruleKey": "B4",
                        "passed": true,
                        "description": "The applicant must be a student studying in Class 9th to Class 12th",
                        "reasons": []
                    },
                    {
                        "ruleKey": "B1",
                        "passed": true,
                        "description": "The applicant must be from SC or ST or OBC castes",
                        "reasons": []
                    },
                    {
                        "ruleKey": "B2",
                        "passed": true,
                        "description": "The Total Annual income of parents/guardians of the applicant must not exceed ₹ 2.50 Lakh per Annum",
                        "reasons": []
                    },
                    {
                        "ruleKey": "B3",
                        "passed": false,
                        "description": "The applicant must be from Rajasthan state",
                        "reasons": [
                            {
                                "type": "userProfile",
                                "field": "state",
                                "reason": "Does not meet criteria: equals",
                                "description": "",
                                "userValue": "mh",
                                "requiredValue": "Rajasthan",
                                "condition": "equals"
                            }
                        ]
                    }
                ]
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
