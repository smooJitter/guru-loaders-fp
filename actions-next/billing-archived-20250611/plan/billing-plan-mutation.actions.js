// billing-plan-mutation.actions.js
// Placeholder for billing plan mutation actions (to be migrated)

// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_PLAN: (msg) => `Invalid plan: ${msg}`,
  PLAN_NOT_FOUND: 'Plan not found',
  INVALID_INPUT: 'Invalid input',
};

const sanitizePlan = (plan) => {
  if (!plan) return plan;
  const { __v, ...rest } = plan;
  return rest;
};

const validatePlan = (data) => {
  if (!data || typeof data !== 'object' || !data.name || !data.stripePriceId) {
    return { isLeft: true, error: ERRORS.INVALID_PLAN('Missing required fields') };
  }
  return { isLeft: false };
};

const validatePlanUpdate = (data) => {
  if (!data || typeof data !== 'object') {
    return { isLeft: true, error: ERRORS.INVALID_PLAN('Invalid update data') };
  }
  return { isLeft: false };
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const createPlan = async ({ context, ...data }) => {
  const { Plan } = context.models;
  const validated = validatePlan(data);
  if (validated.isLeft) throw new Error(validated.error);
  const plan = await new Plan(data).save();
  return sanitizePlan(plan.toObject());
};

const updatePlanStatus = async ({ context, id, isActive }) => {
  const { Plan } = context.models;
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { new: true }
  ).lean().exec();
  if (!plan) throw new Error(ERRORS.PLAN_NOT_FOUND);
  return sanitizePlan(plan);
};

const updatePlan = async ({ context, id, data }) => {
  const { Plan } = context.models;
  const validated = validatePlanUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!plan) throw new Error(ERRORS.PLAN_NOT_FOUND);
  return sanitizePlan(plan);
};

const deletePlan = async ({ context, id }) => {
  const { Plan } = context.models;
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: { deletedAt: new Date(), isActive: false } },
    { new: true }
  ).lean().exec();
  if (!plan) throw new Error(ERRORS.PLAN_NOT_FOUND);
  return sanitizePlan(plan);
};

const restorePlan = async ({ context, id }) => {
  const { Plan } = context.models;
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: { deletedAt: null, isActive: true } },
    { new: true }
  ).lean().exec();
  if (!plan) throw new Error(ERRORS.PLAN_NOT_FOUND);
  return sanitizePlan(plan);
};

const bulkUpdatePlans = async ({ context, ids, data }) => {
  const { Plan } = context.models;
  const validated = validatePlanUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const result = await Plan.updateMany(
    { _id: { $in: ids } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('billingPlan', {
  createPlan,
  updatePlanStatus,
  updatePlan,
  deletePlan,
  restorePlan,
  bulkUpdatePlans
});
