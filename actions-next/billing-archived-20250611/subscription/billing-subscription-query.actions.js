// billing-subscription-query.actions.js
// Placeholder for billing subscription query actions (to be migrated)

// Define configuration and library-specific logic at the top
const sanitizeSubscription = (sub) => {
  if (!sub) return sub;
  const { __v, ...rest } = sub;
  return rest;
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const getSubscriptionByUser = async ({ context, userId }) => {
  const { Subscription } = context.models;
  const sub = await Subscription.findOne({ userId }).lean().exec();
  return sub ? sanitizeSubscription(sub) : null;
};

const getSubscriptionByStripeId = async ({ context, stripeSubscriptionId }) => {
  const { Subscription } = context.models;
  const sub = await Subscription.findOne({ stripeSubscriptionId }).lean().exec();
  return sub ? sanitizeSubscription(sub) : null;
};

const listActiveSubscriptions = async ({ context }) => {
  const { Subscription } = context.models;
  const subs = await Subscription.find({ status: 'active' }).lean().exec();
  return subs ? subs.map(sanitizeSubscription) : [];
};

const searchSubscriptions = async ({ context, query, limit = 10, offset = 0, status }) => {
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

export default withNamespace('billingSubscription', {
  getSubscriptionByUser,
  getSubscriptionByStripeId,
  listActiveSubscriptions,
  searchSubscriptions
});
