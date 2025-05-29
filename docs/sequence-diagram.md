# Sequence Diagram

This diagram illustrates the flow of an eligibility check request through the system.

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant ES as EligibilityService
    participant V as Validator

    C->>S: POST /check-eligibility
    Note over C,S: Send userProfile & benefitsList
    
    S->>V: Validate Request Body
    V-->>S: Validation Result
    
    S->>ES: checkBenefitsEligibility(userProfile, benefitsList)
    
    loop For each benefit schema
        ES->>ES: checkSchemaEligibility()
        loop For each criteria
            ES->>ES: checkCriteria()
            alt Has Custom Rules
                ES->>ES: applyCustomRule()
            else Standard Rules
                ES->>ES: Apply standard conditions
            end
        end
    end
    
    ES-->>S: Return eligibility results
    S-->>C: Send Response
```

## Flow Description

1. **Client Request**
   - Client sends a POST request to `/check-eligibility`
   - Request includes user profile and benefit schemas

2. **Input Validation**
   - Server validates the request body using JSON Schema
   - Ensures all required fields are present and correctly formatted

3. **Eligibility Processing**
   - For each benefit schema:
     - Checks all eligibility criteria
     - Applies custom rules if provided
     - Evaluates standard conditions

4. **Response**
   - Returns results categorized as:
     - Eligible benefits
     - Ineligible benefits
     - Any errors encountered 