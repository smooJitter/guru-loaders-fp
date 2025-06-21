import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  getPlanByIdSchema,
  getPlanByNameSchema,
  listActivePlansSchema,
  searchPlansSchema
} from './validation.js';

/**
 * Query actions for billing/plan
 * @module billing/plan/billing-plan-query.actions
 * All actions are pure, composable, context-injected, and validated.
 */

const ERRORS = {
  PLAN_NOT_FOUND: 'Plan not found',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Remove internal fields from plan object
 * @param {object} plan - The plan object
 * @returns {object} Sanitized plan object
 */
export const sanitizePlan = (plan) => {
  if (!plan) return plan;
  const { __v, ...rest } = plan;
  return rest;
};

/**
 * Get plan by ID
 * @param {object} input - { context, planId }
 * @returns {Promise<object|null>} Plan object or null
 */
const getPlanById = async (input) => {
  const { context, planId } = input;
  await validate(getPlanByIdSchema, { context, planId });
  const { Plan } = context.models;
  const plan = await Plan.findById(planId).lean().exec();
  return plan ? sanitizePlan(plan) : null;
};

/**
 * Get plan by name
 * @param {object} input - { context, name }
 * @returns {Promise<object|null>} Plan object or null
 */
const getPlanByName = async (input) => {
  const { context, name } = input;
  await validate(getPlanByNameSchema, { context, name });
  const { Plan } = context.models;
  const plan = await Plan.findOne({ name }).lean().exec();
  return plan ? sanitizePlan(plan) : null;
};

/**
 * List all active plans
 * @param {object} input - { context, limit, offset }
 * @returns {Promise<object[]>} Array of plan objects
 */
const listActivePlans = async (input) => {
  const { context, limit = 20, offset = 0 } = input;
  await validate(listActivePlansSchema, { context, limit, offset });
  const { Plan } = context.models;
  const plans = await Plan.find({ isActive: true })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec();
  return plans ? plans.map(sanitizePlan) : [];
};

/**
 * Search plans by query (name, description, isActive)
 * @param {object} input - { context, query, limit, offset, isActive }
 * @returns {Promise<object>} Paginated result
 */
const searchPlans = async (input) => {
  const { context, query, limit = 20, offset = 0, isActive } = input;
  await validate(searchPlansSchema, { context, query, limit, offset, isActive });
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

export default withNamespace('billingPlan', [
  { name: 'getPlanById', method: getPlanById, meta: { audit: true } },
  { name: 'getPlanByName', method: getPlanByName, meta: { audit: true } },
  { name: 'listActivePlans', method: listActivePlans, meta: { audit: true } },
  { name: 'searchPlans', method: searchPlans, meta: { audit: true } }
]); 