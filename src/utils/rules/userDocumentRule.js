const { checkCriterion } = require("../eligibilityUtils");

class UserDocumentRule {
    static extractValue(userProfile, criteria) {
        return userProfile.documents?.[criteria.documentKey];
    }

    // Document validity check (moved from benefitSchemaEligibility.js)
    static async checkDocumentValidity(userProfile, schema) {
        const documentRequirements = schema.documents || [];

        if (documentRequirements.length === 0) {
            return { isValid: true, reason: null };
        }

        for (const requirement of documentRequirements) {
            const { documentKey, strictChecking, allowedProofs } = requirement;

            if (strictChecking) {
                if (!userProfile.documents || !userProfile.documents[documentKey]) {
                    return {
                        isValid: false,
                        reason: `Missing required document: ${documentKey}`
                    };
                }

                const userDocument = userProfile.documents[documentKey];

                if (!allowedProofs.includes(userDocument.type)) {
                    return {
                        isValid: false,
                        reason: `Invalid document type for ${documentKey}. Allowed types: ${allowedProofs.join(', ')}`
                    };
                }

                const isValid = await UserDocumentRule.validateDocument(userDocument);
                if (!isValid) {
                    return {
                        isValid: false,
                        reason: `Invalid document: ${documentKey}`
                    };
                }
            }
        }

        return { isValid: true, reason: null };
    }

    // VC checker logic
    static async validateDocument(document) {
        try {
            // TODO: Implement actual VC checker integration
            return document.verified === true;
        } catch (error) {
            console.error('Error validating document:', error);
            return false;
        }
    }

    async execute(document, criteria) {
        const reasons = [];
        // Document validity check
        if (criteria.strictChecking) {
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

        // Use checkCriterion for other checks (e.g., verified, expiry, etc.)
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
}

module.exports = { UserDocumentRule };