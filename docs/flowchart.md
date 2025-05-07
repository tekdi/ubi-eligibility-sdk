# Flowchart

This flowchart illustrates the decision-making process for determining eligibility.

```mermaid
flowchart TD
    A[Start] --> B{Valid Input?}
    B -->|No| C[Return Error]
    B -->|Yes| D[Process Each Schema]
    
    D --> E{Check Schema Eligibility}
    E --> F{Process Criteria}
    
    F -->|Each Criterion| G{Check Criterion}
    G -->|Custom Rule| H[Apply Custom Rule]
    G -->|Standard Rule| I[Apply Standard Condition]
    
    H --> J{Criterion Met?}
    I --> J
    
    J -->|No| K[Mark as Ineligible]
    J -->|Yes| L{More Criteria?}
    
    L -->|Yes| F
    L -->|No| M[Mark as Eligible]
    
    K --> N{More Schemas?}
    M --> N
    
    N -->|Yes| D
    N -->|No| O[Return Results]
    O --> P[End]
```

## Process Description

### Input Validation
- Validates user profile and benefit schema format
- Ensures all required fields are present

### Schema Processing
1. **For Each Schema**
   - Validates schema structure
   - Processes all eligibility criteria

2. **Criteria Evaluation**
   - Checks each criterion individually
   - Applies either custom or standard rules
   - Marks schema as eligible only if all criteria are met

### Result Generation
- Categorizes schemas as eligible or ineligible
- Collects any errors encountered
- Returns comprehensive results

### Decision Points
- Input validation
- Schema eligibility
- Individual criteria evaluation
- Custom vs standard rules
- Final eligibility determination 