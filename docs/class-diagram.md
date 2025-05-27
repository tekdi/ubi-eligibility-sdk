# Class Diagram

This diagram shows the main components and their relationships in the Benefit Eligibility SDK.

```mermaid
classDiagram
    class FastifyServer {
        -logger: boolean
        +register(plugin)
        +get(path, handler)
        +post(path, handler)
        +listen(port, host)
    }

    class EligibilityService {
        -validators: Map
        +checkEligibility(userProfile, benefitSchemas, customRules)
        +checkSchemaEligibility(userProfile, schema, customRules)
        +checkCriterion(userProfile, criterion, customRules)
        -applyCustomRule(userValue, rule)
    }

    class UserProfile {
        +name: string
        +gender: string
        +age: number
        +dateOfBirth: string
        +caste: string
        +income: number
    }

    class BenefitSchema {
        +en: Object
        +basicDetails: Object
        +benefitContent: Object
        +eligibility: Array
    }

    FastifyServer --> EligibilityService : uses
    EligibilityService --> UserProfile : validates
    EligibilityService --> BenefitSchema : processes
```

## Component Description

### FastifyServer
The main server component that handles HTTP requests and routes them to appropriate handlers.

### EligibilityService
Core service that processes eligibility checks and manages validation rules.

### UserProfile
Data structure representing user information required for eligibility checks.

### BenefitSchema
Structure defining benefit schemes and their eligibility criteria. 