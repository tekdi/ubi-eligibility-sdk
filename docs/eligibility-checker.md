# Benefit Eligibility Checker Documentation

## Overview
The Benefit Eligibility Checker is a service that helps determine whether users are eligible for various benefit schemes based on their profile information and the eligibility criteria defined for each scheme.

## Core Functionality

### 1. Checking Schemes for a User
This functionality allows you to check which benefit schemes a specific user is eligible for.

#### Input Requirements
- User Profile (required fields):
  - name: Full name of the user
  - gender: 'Male' or 'Female'
  - age: User's age
  - dateOfBirth: Date of birth in YYYY-MM-DD format
  - caste: Caste category ('sc', 'st', 'obc', 'general')
  - income: Annual income in INR

- Benefit Schemes: Array of benefit scheme objects

#### Example Request
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
  "benefitsList": [
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
          }
        ]
      }
    }
  ]
}
```

#### Response Format
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
  "ineligible": [],
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
      "name": "John Doe",
      "age": 25,
      "caste": "general",
      "income": 250000
    }
  ],
  "ineligibleUsers": [
    {
      "name": "Jane Smith",
      "age": 35,
      "caste": "sc",
      "income": 180000,
      "reasons": ["Age exceeds maximum limit"]
    }
  ]
}
```

## API Endpoints

### 1. Check Eligibility for Schemes
```
POST /check-eligibility
```
This endpoint checks which benefit schemes a user is eligible for.

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

The Benefit Eligibility Checker can be easily deployed using Docker. The service comes with Docker and Docker Compose configurations for both development and production environments.

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

## Redis Configuration

The service uses Redis for caching eligibility results and managing rate limiting. The Redis configuration can be customized using environment variables:

- `REDIS_HOST`: Redis server hostname (default: 'localhost')
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis server password (default: '')
- `REDIS_DB`: Redis database number (default: 0)

### Docker Compose Configuration

When running with Docker Compose, Redis is automatically configured as a separate service. The configuration includes:

- Redis service using the official Redis Alpine image
- Persistent volume for Redis data
- Health checks for both Redis and the eligibility service
- Internal networking between services

### Troubleshooting

#### Redis Connection Issues

If you encounter Redis connection errors:

1. Check if Redis is running:
   ```bash
   docker-compose ps
   ```

2. View Redis logs:
   ```bash
   docker-compose logs redis
   ```

3. Verify Redis connection:
   ```bash
   docker-compose exec redis redis-cli ping
   ```

4. Check service logs:
   ```bash
   docker-compose logs benefit-eligibility
   ```

#### Common Issues

1. **Connection Refused**: Ensure Redis is running and accessible
   - Check if Redis container is running
   - Verify network configuration
   - Check firewall settings

2. **Authentication Failed**: Verify Redis password
   - Check environment variables
   - Ensure password is correctly set in docker-compose.yml

3. **Memory Issues**: Monitor Redis memory usage
   - Check Redis logs for memory warnings
   - Consider increasing container memory limits

4. **Network Issues**: Verify Docker networking
   - Check if services are on the same network
   - Verify service names in environment variables 