import * as yup from 'yup';

/**
 * Validation schemas for billing/subscription actions
 */

export const createSubscriptionSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  planId: yup.string().required(),
  stripeSubscriptionId: yup.string().required(),
  // Additional fields as needed
}).noUnknown(false);

export const updateSubscriptionStatusSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionId: yup.string().required(),
  status: yup.string().oneOf(['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']).required(),
}).noUnknown(false);

export const setCancelAtPeriodEndSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionId: yup.string().required(),
  cancelAtPeriodEnd: yup.boolean().required(),
}).noUnknown(false);

export const updateSubscriptionSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionId: yup.string().required(),
  // Accepts any updatable fields, but at least one must be present
  // # Reason: Allow partial updates, but must not be empty
}).noUnknown(false);

export const deleteSubscriptionSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionId: yup.string().required(),
}).noUnknown(false);

export const restoreSubscriptionSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionId: yup.string().required(),
}).noUnknown(false);

export const bulkUpdateSubscriptionsSchema = yup.object({
  context: yup.mixed().required(),
  ids: yup.array().of(yup.string().required()).min(1).required(),
  // Accepts any updatable fields, but at least one must be present
  // # Reason: Bulk update must specify at least one field to update
}).noUnknown(false);

export const getSubscriptionByUserSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
}).noUnknown(false);

export const getSubscriptionByStripeIdSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionId: yup.string().required(),
}).noUnknown(false);

export const listActiveSubscriptionsSchema = yup.object({
  context: yup.mixed().required(),
}).noUnknown(false);

export const searchSubscriptionsSchema = yup.object({
  context: yup.mixed().required(),
  query: yup.string(),
  limit: yup.number().min(1).max(100).default(10),
  offset: yup.number().min(0).default(0),
  status: yup.string().oneOf(['active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']),
}).noUnknown(false);
