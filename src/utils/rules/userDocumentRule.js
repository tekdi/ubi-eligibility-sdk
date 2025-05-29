const { checkCriterion } = require("../eligibilityUtils");

class UserDocumentRule {
    async execute(userProfile, criteria, strictCheckingFromQuery) {
        const reasons = [];
        // Use strictChecking from query param if provided, else from criteria
        const strictChecking =
            typeof strictCheckingFromQuery === "boolean"
                ? strictCheckingFromQuery
                : criteria.strictChecking;

        // Extract the document
        const document = userProfile.documents?.[criteria.documentKey];

        // If document is missing
        if (document === undefined || document === null) {
            if (strictChecking) {
                reasons.push({
                    type: "userDocument",
                    field: criteria.documentKey,
                    reason: `Missing required document: ${criteria.documentKey}`,
                    description: criteria.description || "",
                });
            }
            // If not strict, missing document is considered eligible (skip further checks)
            return reasons;
        }

        // Allowed proofs check
        if (criteria.allowedProofs && !criteria.allowedProofs.includes(document.type)) {
            reasons.push({
                type: "userDocument",
                field: criteria.documentKey,
                reason: `Document type '${document.type}' not allowed`,
                description: criteria.description || "",
                userValue: document.type,
                requiredValue: criteria.allowedProofs,
                condition: "allowedProofs",
            });
            return reasons;
        }

        // Document validity check (verified)
        if (strictChecking) {
            const validity = await UserDocumentRule.validateDocument(document);
            if (!validity) { 
                reasons.push({
                    type: "userDocument",
                    field: criteria.documentKey,
                    reason: `Invalid or unverified document`,
                    description: criteria.description || "",
                });
                return reasons;
            }
        }

        // Use checkCriterion for other checks (e.g., expiry, etc.)
        if (criteria.condition) {
            const docValue = document[criteria.name];
            const isEligible = await checkCriterion(
                docValue,
                criteria.condition,
                criteria.conditionValues
            );
            if (!isEligible) {
                reasons.push({
                    type: "userDocument",
                    field: criteria.name,
                    reason: `Does not meet criteria: ${criteria.condition}`,
                    description: criteria.description || "",
                    userValue: docValue,
                    requiredValue: criteria.conditionValues,
                    condition: criteria.condition,
                });
            }
        }

        return reasons;
    }

    static async validateDocument(document) {
        try {
            // TODO: Implement actual VC checker integration
            return document.verified === true;
        } catch (error) {
            console.error('Error validating document:', error);
            return false;
        }
    }
}

module.exports = { UserDocumentRule };