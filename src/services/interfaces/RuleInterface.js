class RuleInterface {
  /**
   * @param {Object} config
   */
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Verifies a user profile against specified criteria.
   * Should return:
   *   On success:
   *     { success: true, message: "Verification successful." }
   *   On failure:
   *     { success: false, message: "...", errors: [{ error: "...", raw: "..." }] }
   * @param {Object} userProfile - The user profile to verify
   * @param {Object} criteria - The criteria to verify against
   * @param {boolean} strictCheckingFromQuery - Whether to apply strict checking rules
   * @returns {Promise<Object>}
   */
  async execute(userProfile, criteria, strictCheckingFromQuery) {
    throw new Error('verify() must be implemented by subclass');
  }
}

module.exports = RuleInterface;
