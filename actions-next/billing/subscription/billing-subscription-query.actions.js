import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  getSubscriptionByUserSchema,
  getSubscriptionByStripeIdSchema,
  listActiveSubscriptionsSchema,
  searchSubscriptionsSchema
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
 * Get subscription by user
 * @param {object} input - { context, userId }
 * @returns {Promise<object|null>} Subscription object or null
 */
const getSubscriptionByUser = async (input) => {
  const { context, userId } = input;
  await validate(getSubscriptionByUserSchema, { context, userId });
  const { Subscription } = context.models;
  const sub = await Subscription.findOne({ userId }).lean().exec();
  return sub ? sanitizeSubscription(sub) : null;
};

/**
 * Get subscription by Stripe subscription ID
 * @param {object} input - { context, stripeSubscriptionId }
 * @returns {Promise<object|null>} Subscription object or null
 */
const getSubscriptionByStripeId = async (input) => {
  const { context, stripeSubscriptionId } = input;
  await validate(getSubscriptionByStripeIdSchema, { context, stripeSubscriptionId });
  const { Subscription } = context.models;
  const sub = await Subscription.findOne({ stripeSubscriptionId }).lean().exec();
  return sub ? sanitizeSubscription(sub) : null;
};

/**
 * List all active subscriptions
 * @param {object} input - { context }
 * @returns {Promise<object[]>} Array of subscription objects
 */
const listActiveSubscriptions = async (input) => {
  const { context } = input;
  await validate(listActiveSubscriptionsSchema, { context });
  const { Subscription } = context.models;
  const subs = await Subscription.find({ status: 'active' }).lean().exec();
  return subs ? subs.map(sanitizeSubscription) : [];
};

/**
 * Search subscriptions by query (userId, stripeSubscriptionId, status)
 * @param {object} input - { context, query, limit, offset, status }
 * @returns {Promise<object>} Paginated result
 */
const searchSubscriptions = async (input) => {
  const { context, query, limit = 10, offset = 0, status } = input;
  await validate(searchSubscriptionsSchema, { context, query, limit, offset, status });
  const { Subscription } = context.models;
  const searchQuery = {
    ...(status ? { status } : {}),
    ...(query ? {
      $or: [
        { userId: { $regex: query, $options: 'i' } },
        { stripeSubscriptionId: { $regex: query, $options: 'i' } }
      ]
    } : {})
  };
  const [subs, total] = await Promise.all([
    Subscription.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    Subscription.countDocuments(searchQuery)
  ]);
  return {
    items: subs.map(sanitizeSubscription),
    total,
    hasMore: total > offset + subs.length
  };
};

export default withNamespace('billingSubscription', [
  { name: 'getSubscriptionByUser', method: getSubscriptionByUser },
  { name: 'getSubscriptionByStripeId', method: getSubscriptionByStripeId },
  { name: 'listActiveSubscriptions', method: listActiveSubscriptions },
  { name: 'searchSubscriptions', method: searchSubscriptions }
]); 