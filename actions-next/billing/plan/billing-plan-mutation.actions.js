import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  createPlanSchema,
  updatePlanSchema,
  updatePlanStatusSchema,
  bulkUpdatePlansSchema
} from './validation.js';

/**
 * Mutation actions for billing/plan
 * @module billing/plan/billing-plan-mutation.actions
 * All actions are pure, composable, context-injected, and validated.
 */

const ERRORS = {
  INVALID_PLAN: (msg) => `Invalid plan: ${msg}`,
  PLAN_NOT_FOUND: 'Plan not found',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Remove internal fields from plan object
 * @param {object} plan - The plan object
 * @returns {object} Sanitized plan object
 */
const sanitizePlan = (plan) => {
  if (!plan) return plan;
  const { __v, ...rest } = plan;
  return rest;
};

/**
 * Create a new plan
 * @param {object} input - Input object containing context and plan data
 * @returns {Promise<object>} The created plan object
 */
const createPlan = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(createPlanSchema, { context, ...data });
  const { Plan } = context.models;
  const plan = await new Plan(validated).save();
  return sanitizePlan(plan.toObject());
};

/**
 * Update plan status (isActive)
 * @param {object} input - { context, id, isActive }
 * @returns {Promise<object>} The updated plan object
 */
const updatePlanStatus = async (input) => {
  const { context, id, isActive } = input;
  await validate(updatePlanStatusSchema, { context, id, isActive });
  const { Plan } = context.models;
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { new: true }
  ).lean().exec();
  if (!plan) throw new Error(ERRORS.PLAN_NOT_FOUND);
  return sanitizePlan(plan);
};

/**
 * Update a plan
 * @param {object} input - { context, id, data }
 * @returns {Promise<object>} The updated plan object
 */
const updatePlan = async (input) => {
  const { context, id, data } = input;
  await validate(updatePlanSchema, { context, id, ...data });
  const { Plan } = context.models;
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!plan) throw new Error(ERRORS.PLAN_NOT_FOUND);
  return sanitizePlan(plan);
};

/**
 * Soft-delete a plan
 * @param {object} input - { context, id }
 * @returns {Promise<object>} The deleted plan object
 */
const deletePlan = async (input) => {
  const { context, id } = input;
  const { Plan } = context.models;
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: { deletedAt: new Date(), isActive: false } },
    { new: true }
  ).lean().exec();
  if (!plan) throw new Error(ERRORS.PLAN_NOT_FOUND);
  return sanitizePlan(plan);
};

/**
 * Restore a soft-deleted plan
 * @param {object} input - { context, id }
 * @returns {Promise<object>} The restored plan object
 */
const restorePlan = async (input) => {
  const { context, id } = input;
  const { Plan } = context.models;
  const plan = await Plan.findByIdAndUpdate(
    id,
    { $set: { deletedAt: null, isActive: true } },
    { new: true }
  ).lean().exec();
  if (!plan) throw new Error(ERRORS.PLAN_NOT_FOUND);
  return sanitizePlan(plan);
};

/**
 * Bulk update plans
 * @param {object} input - { context, ids, data }
 * @returns {Promise<object>} Result with matched and modified counts
 */
const bulkUpdatePlans = async (input) => {
  const { context, ids, data } = input;
  await validate(bulkUpdatePlansSchema, { context, ids, ...data });
  const { Plan } = context.models;
  const result = await Plan.updateMany(
    { _id: { $in: ids } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('billingPlan', [
  { name: 'createPlan', method: createPlan, meta: { audit: true } },
  { name: 'updatePlanStatus', method: updatePlanStatus, meta: { audit: true } },
  { name: 'updatePlan', method: updatePlan, meta: { audit: true } },
  { name: 'deletePlan', method: deletePlan, meta: { audit: true } },
  { name: 'restorePlan', method: restorePlan, meta: { audit: true } },
  { name: 'bulkUpdatePlans', method: bulkUpdatePlans, meta: { audit: true } }
]); 