// billing-subscription-mutation.actions.js
// Placeholder for billing subscription mutation actions (to be migrated)

// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_SUBSCRIPTION: (msg) => `Invalid subscription: ${msg}`,
  SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
  INVALID_INPUT: 'Invalid input',
};

const sanitizeSubscription = (sub) => {
  if (!sub) return sub;
  const { __v, ...rest } = sub;
  return rest;
};

const validateSubscription = (data) => {
  if (!data || typeof data !== 'object' || !data.userId || !data.planId || !data.stripeSubscriptionId) {
    return { isLeft: true, error: ERRORS.INVALID_SUBSCRIPTION('Missing required fields') };
  }
  return { isLeft: false };
};

const validateSubscriptionUpdate = (data) => {
  if (!data || typeof data !== 'object') {
    return { isLeft: true, error: ERRORS.INVALID_SUBSCRIPTION('Invalid update data') };
  }
  return { isLeft: false };
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const createSubscription = async ({ context, ...data }) => {
  const { Subscription } = context.models;
  const validated = validateSubscription(data);
  if (validated.isLeft) throw new Error(validated.error);
  const sub = await new Subscription({ ...data, status: 'active' }).save();
  return sanitizeSubscription(sub.toObject());
};

const updateSubscriptionStatus = async ({ context, stripeSubscriptionId, status }) => {
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { status } },
    { new: true }
  ).lean().exec();
  if (!sub) throw new Error(ERRORS.SUBSCRIPTION_NOT_FOUND);
  return sanitizeSubscription(sub);
};

const setCancelAtPeriodEnd = async ({ context, stripeSubscriptionId, cancelAtPeriodEnd }) => {
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { cancelAtPeriodEnd } },
    { new: true }
  ).lean().exec();
  if (!sub) throw new Error(ERRORS.SUBSCRIPTION_NOT_FOUND);
  return sanitizeSubscription(sub);
};

const updateSubscription = async ({ context, stripeSubscriptionId, data }) => {
  const { Subscription } = context.models;
  const validated = validateSubscriptionUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!sub) throw new Error(ERRORS.SUBSCRIPTION_NOT_FOUND);
  return sanitizeSubscription(sub);
};

const deleteSubscription = async ({ context, stripeSubscriptionId }) => {
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { deletedAt: new Date(), status: 'cancelled' } },
    { new: true }
  ).lean().exec();
  if (!sub) throw new Error(ERRORS.SUBSCRIPTION_NOT_FOUND);
  return sanitizeSubscription(sub);
};

const restoreSubscription = async ({ context, stripeSubscriptionId }) => {
  const { Subscription } = context.models;
  const sub = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { deletedAt: null, status: 'active' } },
    { new: true }
  ).lean().exec();
  if (!sub) throw new Error(ERRORS.SUBSCRIPTION_NOT_FOUND);
  return sanitizeSubscription(sub);
};

const bulkUpdateSubscriptions = async ({ context, ids, data }) => {
  const { Subscription } = context.models;
  const validated = validateSubscriptionUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const result = await Subscription.updateMany(
    { _id: { $in: ids } },
    { $set: data }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('billingSubscription', {
  createSubscription,
  updateSubscriptionStatus,
  setCancelAtPeriodEnd,
  updateSubscription,
  deleteSubscription,
  restoreSubscription,
  bulkUpdateSubscriptions
});
