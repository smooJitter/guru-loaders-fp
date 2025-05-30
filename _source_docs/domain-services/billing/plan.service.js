import Plan from '../models/Plan.js';

/**
 * Remove sensitive fields from a plan object
 * @param {Object} plan
 * @returns {Object}
 */
const sanitizePlan = (plan) => {
  if (!plan) return plan;
  // Add/remove fields as needed for your domain
  const { /* internalOnlyField, */ ...safePlan } = plan;
  return safePlan;
};

/**
 * Create a new plan
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.stripePriceId
 * @returns {Promise<Object>} // sanitized plan
 */
export const createPlan = async ({ name, stripePriceId }) => {
  const plan = await new Plan({ name, stripePriceId }).save();
  return sanitizePlan(plan.toObject());
};

/**
 * Get plan by ID
 * @param {Object} params
 * @param {string} params.id
 * @returns {Promise<Object>} // sanitized plan
 */
export const getPlanById = async ({ id }) => {
  const plan = await Plan.findById(id).lean().exec();
  return sanitizePlan(plan);
};

/**
 * Get plan by name
 * @param {Object} params
 * @param {string} params.name
 * @returns {Promise<Object>} // sanitized plan
 */
export const getPlanByName = async ({ name }) => {
  const plan = await Plan.findOne({ name }).lean().exec();
  return sanitizePlan(plan);
};

/**
 * Update plan status
 * @param {Object} params
 * @param {string} params.id
 * @param {boolean} params.isActive
 * @returns {Promise<Object>} // sanitized plan
 */
export const updatePlanStatus = async ({ id, isActive }) => {
  const plan = await Plan.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  ).lean().exec();
  return sanitizePlan(plan);
};

/**
 * List all active plans
 * @returns {Promise<Object[]>} // array of sanitized plans
 */
export const listActivePlans = async () => {
  const plans = await Plan.find({ isActive: true }).lean().exec();
  return plans ? plans.map(sanitizePlan) : [];
}; 