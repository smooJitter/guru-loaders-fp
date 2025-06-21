// billing-plan-query.actions.js
// Placeholder for billing plan query actions (to be migrated)

// Define configuration and library-specific logic at the top
const sanitizePlan = (plan) => {
  if (!plan) return plan;
  const { __v, ...rest } = plan;
  return rest;
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const getPlanById = async ({ context, id }) => {
  const { Plan } = context.models;
  const plan = await Plan.findById(id).lean().exec();
  return plan ? sanitizePlan(plan) : null;
};

const getPlanByName = async ({ context, name }) => {
  const { Plan } = context.models;
  const plan = await Plan.findOne({ name }).lean().exec();
  return plan ? sanitizePlan(plan) : null;
};

const listActivePlans = async ({ context }) => {
  const { Plan } = context.models;
  const plans = await Plan.find({ isActive: true }).lean().exec();
  return plans ? plans.map(sanitizePlan) : [];
};

const searchPlans = async ({ context, query, limit = 10, offset = 0, isActive }) => {
  const { Plan } = context.models;
  const searchQuery = {
    ...(isActive !== undefined ? { isActive } : {}),
    ...(query ? {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    } : {})
  };
  const [plans, total] = await Promise.all([
    Plan.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Plan.countDocuments(searchQuery)
  ]);
  return {
    items: plans.map(sanitizePlan),
    total,
    hasMore: total > offset + plans.length
  };
};

export default withNamespace('billingPlan', {
  getPlanById,
  getPlanByName,
  listActivePlans,
  searchPlans
});
