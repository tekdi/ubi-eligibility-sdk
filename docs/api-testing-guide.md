# Benefit Eligibility API Testing Guide

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Health Check
```
GET /health
```
Response:
```json
{
  "status": "ok"
}
```

### 2. Check Eligibility for Schemes
```
POST /check-eligibility
```

#### Request Payload
```json
{
  "userProfile": {
    "name": "John Doe",
    "gender": "Male",
    "age": 25,
    "dateOfBirth": "1998-05-15",
    "caste": "general",
    "income": 250000
  },
  "benefitSchemas": [
    {
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
          },
          {
            "type": "economic",
            "description": "Income criteria",
            "criteria": {
              "name": "income",
              "condition": "less than equals",
              "conditionValues": 500000
            }
          }
        ]
      }
    },
    {
      "en": {
        "basicDetails": {
          "title": "Housing Subsidy",
          "category": "Housing",
          "subCategory": "Subsidy"
        },
        "benefitContent": {
          "benefits": [
            {
              "type": "financial",
              "title": "Housing Loan Subsidy",
              "description": "Up to ₹2,00,000 subsidy on housing loan"
            }
          ]
        },
        "eligibility": [
          {
            "type": "social",
            "description": "Caste criteria",
            "criteria": {
              "name": "caste",
              "condition": "in",
              "conditionValues": ["sc", "st", "obc"]
            }
          },
          {
            "type": "economic",
            "description": "Income criteria",
            "criteria": {
              "name": "income",
              "condition": "less than equals",
              "conditionValues": 300000
            }
          }
        ]
      }
    }
  ],
  "customRules": {
    "age": {
      "condition": "custom",
      "rule": "age < 30 && income < 500000"
    }
  }
}
```

#### Response
```json
{
  "eligible": [
    {
      "schemaId": "education-scholarship",
      "details": {
        "title": "Education Scholarship",
        "category": "Education",
        "subCategory": "Scholarship"
      },
      "benefits": {
        "benefits": [
          {
            "type": "financial",
            "title": "Annual Scholarship",
            "description": "₹50,000 per year"
          }
        ]
      }
    }
  ],
  "ineligible": [
    {
      "schemaId": "housing-subsidy",
      "details": {
        "title": "Housing Subsidy",
        "category": "Housing",
        "subCategory": "Subsidy"
      },
      "reasons": ["Caste criteria not met"]
    }
  ],
  "errors": []
}
```

### 3. Check Users for Scheme
```
POST /check-users-eligibility
```

#### Request Payload
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
        },
        {
          "type": "economic",
          "description": "Income criteria",
          "criteria": {
            "name": "income",
            "condition": "less than equals",
            "conditionValues": 500000
          }
        }
      ]
    }
  }
}
```

#### Response
```json
{
  "eligibleUsers": [
    {
      "name": "John Doe",
      "gender": "Male",
      "age": 25,
      "dateOfBirth": "1998-05-15",
      "caste": "general",
      "income": 250000
    }
  ],
  "ineligibleUsers": [
    {
      "name": "Jane Smith",
      "gender": "Female",
      "age": 35,
      "dateOfBirth": "1988-03-20",
      "caste": "sc",
      "income": 180000,
      "reasons": ["Age exceeds maximum limit"]
    }
  ]
}
```

#### Using cURL
```bash
curl -X POST http://localhost:3000/schemes/users \
  -H "Content-Type: application/json" \
  -d @scheme-users-request.json
```

### 5. List User Profiles for a Scheme
```
POST /schemes/users
```

#### Request Payload
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
        },
        {
          "type": "economic",
          "description": "Income criteria",
          "criteria": {
            "name": "income",
            "condition": "less than equals",
            "conditionValues": 500000
          }
        }
      ]
    }
  }
}
```

#### Response
```json
{
  "eligibleUsers": [
    {
      "name": "John Doe",
      "gender": "Male",
      "age": 25,
      "dateOfBirth": "1998-05-15",
      "caste": "general",
      "income": 250000
    }
  ],
  "ineligibleUsers": [
    {
      "name": "Jane Smith",
      "gender": "Female",
      "age": 35,
      "dateOfBirth": "1988-03-20",
      "caste": "sc",
      "income": 180000,
      "reasons": ["Age exceeds maximum limit"]
    }
  ]
}
```

#### Using cURL
```bash
curl -X POST http://localhost:3000/schemes/users \
  -H "Content-Type: application/json" \
  -d @scheme-users-request.json
```

## Testing Tools

### Using cURL

1. Health Check:
```bash
curl -X GET http://localhost:3000/health
```

2. Check Eligibility for Schemes:
```bash
curl -X POST http://localhost:3000/check-eligibility \
  -H "Content-Type: application/json" \
  -d @request.json
```

3. Check Users for Scheme:
```bash
curl -X POST http://localhost:3000/check-users-eligibility \
  -H "Content-Type: application/json" \
  -d @users-request.json
```

### Using Postman

1. Create a new collection named "Benefit Eligibility API"
2. Add the following requests:

#### Health Check
- Method: GET
- URL: http://localhost:3000/health

#### Check Eligibility
- Method: POST
- URL: http://localhost:3000/check-eligibility
- Headers: Content-Type: application/json
- Body: Raw JSON (use the request payload example above)

#### Check Users Eligibility
- Method: POST
- URL: http://localhost:3000/check-users-eligibility
- Headers: Content-Type: application/json
- Body: Raw JSON (use the users request payload example above)

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "details": {
    "field": "age",
    "message": "Age must be a positive number"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Testing Scenarios

### 1. Valid User Profile
- All required fields present
- Valid data types
- Within acceptable ranges

### 2. Invalid User Profile
- Missing required fields
- Invalid data types
- Out of range values

### 3. Multiple Benefit Schemes
- Check eligibility for multiple schemes
- Different eligibility criteria
- Mixed results (some eligible, some not)

### 4. Custom Rules
- Override standard eligibility checks
- Complex conditions
- Multiple criteria combinations

### 5. Edge Cases
- Minimum/maximum age limits
- Income thresholds
- Special caste categories
- Multiple eligibility criteria 