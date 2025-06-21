import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  createSubscriptionSchema,
  updateSubscriptionStatusSchema,
  setCancelAtPeriodEndSchema,
  updateSubscriptionSchema,
  deleteSubscriptionSchema,
  restoreSubscriptionSchema,
  bulkUpdateSubscriptionsSchema
} from './validation.js';

/**
 * Remove internal fields from subscription object
 * @param {object} sub - The subscription object
 * @returns {object} Sanitized subscription object
 */
export const sanitizeSubscription = (sub) => {
  if (!sub) return sub;
  const { __v, ...rest } = sub;
  return rest;
};

/**
 * Create a new subscription
 * @param {object} input - Input object containing context and subscription data
 * @returns {Promise<object>} The created subscription object
 */
const createSubscription = async (input) => {
  const { context, ...data } = input;
  const validated = await validate(createSubscriptionSchema, { context, ...data });
  const { Subscription } = context.models;
  const sub = await new Subscription({ ...validated, status: 'active' }).save();
  return sanitizeSubscription(sub.toObject());
};

/**
 * Update subscription status
 * @param {object} input - { context, stripeSubscriptionId, status }
 * @returns {Promise<object>} The updated subscription object
 */
const updateSubscriptionStatus = async (input) => {
  const { context, stripeSubscriptionId, status } = input;
  await validate(updateSubscriptionStatusSchema, { context, stripeSubscriptionId, status });
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { status } },
    { new: true }
  ).lean().exec();
  if (!sub) throw new Error('Subscription not found');
  return sanitizeSubscription(sub);
};

/**
 * Set cancelAtPeriodEnd flag
 * @param {object} input - { context, stripeSubscriptionId, cancelAtPeriodEnd }
 * @returns {Promise<object>} The updated subscription object
 */
const setCancelAtPeriodEnd = async (input) => {
  const { context, stripeSubscriptionId, cancelAtPeriodEnd } = input;
  await validate(setCancelAtPeriodEndSchema, { context, stripeSubscriptionId, cancelAtPeriodEnd });
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { cancelAtPeriodEnd } },
    { new: true }
  ).lean().exec();
  if (!sub) throw new Error('Subscription not found');
  return sanitizeSubscription(sub);
};

/**
 * Update a subscription
 * @param {object} input - { context, stripeSubscriptionId, data }
 * @returns {Promise<object>} The updated subscription object
 */
const updateSubscription = async (input) => {
  const { context, stripeSubscriptionId, data } = input;
  await validate(updateSubscriptionSchema, { context, stripeSubscriptionId, ...data });
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!sub) throw new Error('Subscription not found');
  return sanitizeSubscription(sub);
};

/**
 * Soft-delete a subscription
 * @param {object} input - { context, stripeSubscriptionId }
 * @returns {Promise<object>} The deleted subscription object
 */
const deleteSubscription = async (input) => {
  const { context, stripeSubscriptionId } = input;
  await validate(deleteSubscriptionSchema, { context, stripeSubscriptionId });
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { deletedAt: new Date(), status: 'cancelled' } },
    { new: true }
  ).lean().exec();
  if (!sub) throw new Error('Subscription not found');
  return sanitizeSubscription(sub);
};

/**
 * Restore a soft-deleted subscription
 * @param {object} input - { context, stripeSubscriptionId }
 * @returns {Promise<object>} The restored subscription object
 */
const restoreSubscription = async (input) => {
  const { context, stripeSubscriptionId } = input;
  await validate(restoreSubscriptionSchema, { context, stripeSubscriptionId });
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { deletedAt: null, status: 'active' } },
    { new: true }
  ).lean().exec();
  if (!sub) throw new Error('Subscription not found');
  return sanitizeSubscription(sub);
};

/**
 * Bulk update subscriptions
 * @param {object} input - { context, ids, data }
 * @returns {Promise<object>} Result with matched and modified counts
 */
const bulkUpdateSubscriptions = async (input) => {
  const { context, ids, data } = input;
  await validate(bulkUpdateSubscriptionsSchema, { context, ids, ...data });
  const { Subscription } = context.models;
  const result = await Subscription.updateMany(
    { _id: { $in: ids } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('billingSubscription', [
  { name: 'createSubscription', method: createSubscription },
  { name: 'updateSubscriptionStatus', method: updateSubscriptionStatus },
  { name: 'setCancelAtPeriodEnd', method: setCancelAtPeriodEnd },
  { name: 'updateSubscription', method: updateSubscription },
  { name: 'deleteSubscription', method: deleteSubscription },
  { name: 'restoreSubscription', method: restoreSubscription },
  { name: 'bulkUpdateSubscriptions', method: bulkUpdateSubscriptions }
]); 