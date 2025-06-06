# Benefit Eligibility Checker Documentation

## Overview
The Benefit Eligibility Checker is a service that helps determine whether users are eligible for various benefit schemes based on their profile information and the eligibility criteria defined for each scheme.

## Core Functionality

### 1. Checking Schemes for a User
This functionality allows you to check which benefit schemes a specific user is eligible for.

#### Input Requirements
- User Profile (required fields):
  - name: Full name of the user
  - gender: 'male' or 'female'
  - age: User's age
  - dateOfBirth: Date of birth in YYYY-MM-DD format
  - caste: Caste category ('sc', 'st', 'obc', 'general')
  - income: Annual income in INR
  - class: Current class/grade (if applicable)
  - previousYearMarks: Previous year's marks (if applicable)
  - state: State of residence
  - documents: Object containing verified documents
    - aadhaar: Aadhaar card details
    - marksheet: Marksheet details
    - casteCertificate: Caste certificate details
    - incomeCertificate: Income certificate details

- Benefit Schemas: Array of benefit scheme objects
- Custom Rules (optional): Object containing custom eligibility rules

#### Example Request
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
        "state": "maharashtra"
    },
    "benefitsList": [
        {
            "id": "ubi-pilot-scholarship-1",
            "eligibility": [
                {
                    "id": "B5",
                    "type": "userProfile", //userProfile
                    "description": "Gender of Applicant - both male and female allowed to avail scholarship",
                    "criteria": {
                        "name": "gender", // key is field
                        "condition": "in",
                        "conditionValues": [
                            "male",
                            "female"
                        ]
                    }
                },
                {
                    "id": "B4",
                    "type": "userProfile", // userDocument
                    "description": "The applicant must be a student studying in Class 9th to Class 12th",
                    "criteria": {
                        "name": "class",
                        "documentKey": "marksheet",
                        "condition": "in",
                        "conditionValues": [
                            "9",
                            "10",
                            "11",
                            "12"
                        ]
                    }
                },
                {
                    "type": "userProfile",
                    "id": "B1",
                    "description": "The applicant must be from SC or ST or OBC castes",
                    "criteria": {
                        "documentKey": "casteCertificate",
                        "name": "caste",
                        "condition": "in",
                        "conditionValues": [
                            "sc",
                            "st",
                            "obc"
                        ]
                    }
                },
                {
                    "type": "userProfile",
                    "id": "B2",
                    "description": "The Total Annual income of parents/guardians of the applicant must not exceed ₹ 2.50 Lakh per Annum",
                    "criteria": {
                        "name": "income",
                        "documentKey": "incomeCertificate",
                        "condition": "less than equals",
                        "conditionValues": "100000"
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

#### Response Format
```json
{
    "eligible": [],
    "ineligible": [
        {
            "schemaId": "ubi-pilot-scholarship-1",
            "details": {
                "isEligible": false,
                "reasons": [
                    {
                        "type": "userProfile",
                        "field": "state",
                        "reason": "Does not meet criteria: equals",
                        "description": "",
                        "userValue": "maharashtra",
                        "requiredValue": "Rajasthan",
                        "condition": "equals"
                    },
                    {
                        "type": "eligibilityEvaluationLogic",
                        "reason": "Error evaluating eligibilityEvaluationLogic: B1 is not defined",
                        "description": "(B1 && B2) || B3"
                    }
                ],
                "evaluationResults": {
                    "undefined": false
                },
                "criteriaResults": [
                    {
                        "passed": true,
                        "description": "Gender of Applicant - both male and female allowed to avail scholarship",
                        "reasons": []
                    },
                    {
                        "passed": true,
                        "description": "The applicant must be a student studying in Class 9th to Class 12th",
                        "reasons": []
                    },
                    {
                        "passed": true,
                        "description": "The applicant must be from SC or ST or OBC castes",
                        "reasons": []
                    },
                    {
                        "passed": true,
                        "description": "The Total Annual income of parents/guardians of the applicant must not exceed ₹ 2.50 Lakh per Annum",
                        "reasons": []
                    },
                    {
                        "passed": false,
                        "description": "The applicant must be from Rajasthan state",
                        "reasons": [
                            {
                                "type": "userProfile",
                                "field": "state",
                                "reason": "Does not meet criteria: equals",
                                "description": "",
                                "userValue": "maharashtra",
                                "requiredValue": "Rajasthan",
                                "condition": "equals"
                            }
                        ]
                    }
                ]
            }
        }
    ],
    "errors": []
}
```

### 2. Checking Users for a Scheme
This functionality allows you to check which users are eligible for a specific benefit scheme.

#### Input Requirements
- User Profiles: Array of user profile objects
- Benefit Scheme: Single benefit scheme object

#### Example Request
```json
{
  "userProfiles": [
    {
      "name": "John Doe",
      "gender": "Male",
      "age": 25,
      "dateOfBirth": "1998-05-15",
      "caste": "general",
      "income": 250000
    },
    {
      "name": "Jane Smith",
      "gender": "Female",
      "age": 35,
      "dateOfBirth": "1988-03-20",
      "caste": "sc",
      "income": 180000
    }
  ],
  "benefitSchema": {
    "en": {
      "basicDetails": {
        "title": "Education Scholarship",
        "category": "Education",
        "subCategory": "Scholarship"
      },
      "benefitContent": {
        "benefits": [
          {
            "type": "financial",
            "title": "Annual Scholarship",
            "description": "₹50,000 per year"
          }
        ]
      },
      "eligibility": [
        {
          "type": "personal",
          "description": "Age criteria",
          "criteria": {
            "name": "age",
            "condition": "less than equals",
            "conditionValues": 30
          }
        }
      ]
    }
  }
}
```

#### Response Format
```json
{
  "eligibleUsers": [
    {
      "userId": "user123",
      "eligibleSchemes": [
        {
          "schemeId": "scholarship123",
          "title": "National Scholarship Program",
          "category": "Education",
          "subCategory": "Scholarship",
          "applicationOpenDate": "2024-01-01",
          "applicationCloseDate": "2024-12-31"
        }
      ]
    }
  ],
  "ineligibleUsers": [
    {
      "userId": "user456",
      "ineligibleSchemes": [
        {
          "schemeId": "scholarship123",
          "title": "National Scholarship Program",
          "category": "Education",
          "subCategory": "Scholarship",
          "applicationOpenDate": "2024-01-01",
          "applicationCloseDate": "2024-12-31",
          "reasons": [
            {
              "type": "personal",
              "field": "age",
              "reason": "Does not meet personal criteria: Age must be between 18 and 25",
              "description": "Age must be between 18 and 25",
              "userValue": 17,
              "requiredValue": [18, 25],
              "condition": "between"
            },
            {
              "type": "educational",
              "field": "previousYearMarks",
              "reason": "Does not meet educational criteria: Minimum 60% marks required",
              "description": "Minimum 60% marks required",
              "userValue": 55,
              "requiredValue": 60,
              "condition": "greaterThan"
            },
            {
              "type": "document",
              "field": "casteCertificate",
              "reason": "Missing or invalid document for: Caste Certificate",
              "description": "Caste Certificate",
              "requiredDocuments": [
                {
                  "name": "Caste Certificate",
                  "validity": "1 year",
                  "issuingAuthority": "Tehsildar"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "errors": []
}
```

## API Endpoints

### 1. Check Eligibility for Schemes
```
POST /check-eligibility
```
This endpoint checks which benefit schemes a user is eligible for.

#### Request Body
- `userProfile`: Object containing user's profile information
- `benefitsList`: Array of benefit scheme objects to check against
- `eligibilityEvaluationLogic`: Optional object containing custom eligibility rules

#### Response
- `eligible`: Array of eligible benefit schemes with details
- `ineligible`: Array of ineligible benefit schemes with reasons
- `errors`: Array of any errors that occurred during processing

### 2. Check Users for Scheme
```
POST /check-users-eligibility
```
This endpoint checks which users are eligible for a specific benefit scheme.

## Eligibility Criteria Types

The system supports various types of eligibility criteria:

1. **Personal Criteria**
   - Age
   - Gender
   - Date of Birth

2. **Economic Criteria**
   - Income
   - Property Ownership
   - Employment Status

3. **Social Criteria**
   - Caste
   - Religion
   - Disability Status

4. **Geographical Criteria**
   - State
   - District
   - Urban/Rural

## Condition Types

The system supports the following condition types:

1. `equals`: Exact match
2. `in`: Value exists in a list
3. `greater than equals`: Numeric comparison
4. `less than equals`: Numeric comparison

## Error Handling

The system provides detailed error messages for:
- Invalid input data
- Missing required fields
- Invalid data types
- Validation failures

## Custom Rules

You can provide custom rules to override standard eligibility checks:

```json
{
  "eligibilityEvaluationLogic": {
    "age": {
      "condition": "custom",
      "rule": "age < 30 && income < 500000"
    }
  }
}
```

## Best Practices

1. Always validate user profiles before checking eligibility
2. Keep benefit scheme definitions up to date
3. Use appropriate error handling
4. Consider performance when checking large numbers of users or schemes
5. Implement proper logging for eligibility checks

## Docker Deployment

The Benefit Eligibility Checker can be easily deployed using Docker.

### Prerequisites
- Docker installed on your system
- Docker Compose installed on your system

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd benefit-eligibility-sdk
```

2. Build and start the container:
```bash
docker-compose up --build
```

3. The service will be available at:
```
http://localhost:3000
```

### Docker Commands

#### Build the image
```bash
docker build -t benefit-eligibility-sdk .
```

#### Run the container
```bash
docker run -p 3000:3000 benefit-eligibility-sdk
```

#### Stop the container
```bash
docker-compose down
```

### Environment Variables

The following environment variables can be configured:

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Port number for the service (default: 3000)

### Health Check

The container includes a health check that monitors the service's availability:
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3
- Start period: 40 seconds

### Development Mode

For development, you can use the following command to enable hot-reloading:
```bash
docker-compose up --build
```

The service will automatically restart when you make changes to the source code.

### Production Deployment

For production deployment, it's recommended to:
1. Use a production-grade Node.js image
2. Implement proper logging
3. Set up monitoring
4. Configure proper security settings
5. Use environment variables for sensitive data 
5. Use environment variables for sensitive data 

## Required User Profile Credentials

Based on the example benefit schemes, here are the required user profile credentials and their validation rules:

### 1. Basic Personal Information
```json
{
  "name": "string",                    // Full name of the user
  "gender": "string",                  // Must be either "male" or "female"
  "age": "number",                     // User's age
  "dateOfBirth": "string",             // Date in YYYY-MM-DD format
  "caste": "string",                   // Must be one of: "sc", "st", "obc", "general"
  "state": "string"                    // State of residence (e.g., "Rajasthan")
}
```

### 2. Educational Information
```json
{
  "class": "string",                   // Current class/grade (e.g., "9", "10", "11", "12")
  "previousYearMarks": "number",       // Previous year's marks in percentage
  "documents": {
    "marksheet": {
      "type": "marksheet",
      "verified": true
    },
    "enrollmentCertificate": {
      "type": "enrollmentCertificate",
      "verified": true
    }
  }
}
```

### 3. Economic Information
```json
{
  "income": "number",                  // Annual income in INR
  "documents": {
    "incomeCertificate": {
      "type": "incomeCertificate",
      "verified": true
    }
  }
}
```

### 4. Identity and Caste Documents
```json
{
  "documents": {
    "aadhaar": {
      "type": "aadhaar",
      "verified": true
    },
    "casteCertificate": {
      "type": "casteCertificate",
      "verified": true
    }
  }
}
```

### 5. Additional Documents (if applicable)
```json
{
  "documents": {
    "disabilityCertificate": {
      "type": "disabilityCertificate",
      "verified": true
    },
    "janAadharCertificate": {
      "type": "janAadharCertificate",
      "verified": true
    }
  }
}
```

### Example Complete User Profile
```json
{
  "name": "John Doe",
  "gender": "male",
  "age": 16,
  "dateOfBirth": "2008-01-01",
  "caste": "sc",
  "state": "Rajasthan",
  "class": "10",
  "previousYearMarks": 75,
  "income": 200000,
  "documents": {
    "aadhaar": {
      "type": "aadhaar",
      "verified": true
    },
    "marksheet": {
      "type": "marksheet",
      "verified": true
    },
    "enrollmentCertificate": {
      "type": "enrollmentCertificate",
      "verified": true
    },
    "casteCertificate": {
      "type": "casteCertificate",
      "verified": true
    },
    "incomeCertificate": {
      "type": "incomeCertificate",
      "verified": true
    }
  }
}
```

### Validation Rules

1. **Personal Information**
   - Gender must be either "male" or "female"
   - Age must be a positive number
   - Date of birth must be in YYYY-MM-DD format
   - Caste must be one of: "sc", "st", "obc", "general"

2. **Educational Information**
   - Class must be one of: "9", "10", "11", "12"
   - Previous year marks must be between 0 and 100
   - Marksheet must be verified

3. **Economic Information**
   - Income must be a positive number
   - Income certificate must be verified

4. **Document Verification**
   - All required documents must be present
   - All documents must have verified: true
   - Document types must match the allowed types

### Common Eligibility Criteria

Based on the example schemes, here are the common eligibility checks:

1. **Educational Criteria**
   - Class level (9th to 12th)
   - Previous year marks (minimum percentage)

2. **Personal Criteria**
   - Gender (male/female)
   - Caste (SC/ST/OBC/General)
   - State of residence

3. **Economic Criteria**
   - Annual income limit
   - Income certificate verification

4. **Document Requirements**
   - Aadhaar card
   - Marksheet
   - Caste certificate
   - Income certificate
   - Enrollment certificate

## Detailed Ineligibility Reasons

The system now provides detailed reasons for ineligibility, including:

1. **Type of Criteria**
   - `personal`: Age, gender, date of birth
   - `educational`: Class, marks, qualifications
   - `economical`: Income, property
   - `geographical`: State, district
   - `document`: Required documents
   - `application`: Application period

2. **Field Information**
   - Name of the field that failed validation
   - User's actual value
   - Required value/condition
   - Description of the requirement

3. **Document Requirements**
   - Required document types
   - Document validity period
   - Issuing authority
   - Verification status

4. **Application Period**
   - Current date
   - Application open date
   - Application close date
   - Reason for period ineligibility

### Example Ineligibility Reasons

1. **Personal Criteria**
```json
{
  "type": "personal",
  "field": "age",
  "reason": "Does not meet personal criteria: Age must be between 18 and 25",
  "description": "Age must be between 18 and 25",
  "userValue": 17,
  "requiredValue": [18, 25],
  "condition": "between"
}
```

2. **Document Requirements**
```json
{
  "type": "document",
  "field": "casteCertificate",
  "reason": "Missing or invalid document for: Caste Certificate",
  "description": "Caste Certificate",
  "requiredDocuments": [
    {
      "name": "Caste Certificate",
      "validity": "1 year",
      "issuingAuthority": "Tehsildar"
    }
  ]
}
```

3. **Application Period**
```json
{
  "type": "application",
  "field": "applicationOpenDate",
  "reason": "Application period not started",
  "description": "Application opens on: 2024-01-01",
  "currentDate": "2023-12-15"
}
```