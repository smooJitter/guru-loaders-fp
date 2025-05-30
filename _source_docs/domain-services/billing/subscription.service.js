import Subscription from '../models/Subscription.js';

// Create
export async function createSubscription({ userId, planId, stripeSubscriptionId, currentPeriodEnd }) {
  return new Subscription({
    userId,
    planId,
    stripeSubscriptionId,
    currentPeriodEnd,
    status: 'active'
  }).save();
}

// Read
export async function getSubscriptionByUserId({ userId }) {
  return Subscription.findOne({ userId }).exec();
}

export async function getSubscriptionByStripeId({ stripeSubscriptionId }) {
  return Subscription.findOne({ stripeSubscriptionId }).exec();
}

// Update
export async function updateSubscriptionStatus({ stripeSubscriptionId, status }) {
  return Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { status },
    { new: true }
  ).exec();
}

export async function setCancelAtPeriodEnd({ stripeSubscriptionId, cancelAtPeriodEnd }) {
  return Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { cancelAtPeriodEnd },
    { new: true }
  ).exec();
}

// List
export async function listActiveSubscriptions() {
  return Subscription.find({ status: 'active' }).exec();
} 