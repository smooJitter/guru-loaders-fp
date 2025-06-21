import * as yup from 'yup';

// --- Mutation Schemas ---

/**
 * Schema for createSubscription
 */
export const createSubscriptionSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  planId: yup.string().required(),
  paymentMethodId: yup.string().required(),
}).noUnknown(false);

/**
 * Schema for cancelSubscription
 */
export const cancelSubscriptionSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionId: yup.string().required(),
}).noUnknown(false);

/**
 * Schema for updateSubscriptionInStripe
 */
export const updateSubscriptionInStripeSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionId: yup.string().required(),
  updates: yup.object().required(),
}).noUnknown(false);

/**
 * Schema for attachPaymentMethod
 */
export const attachPaymentMethodSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  paymentMethodId: yup.string().required(),
}).noUnknown(false);

/**
 * Schema for detachPaymentMethod
 */
export const detachPaymentMethodSchema = yup.object({
  context: yup.mixed().required(),
  paymentMethodId: yup.string().required(),
}).noUnknown(false);

/**
 * Schema for refundInvoice
 */
export const refundInvoiceSchema = yup.object({
  context: yup.mixed().required(),
  stripeInvoiceId: yup.string().required(),
  amount: yup.number().required(),
}).noUnknown(false);

/**
 * Schema for bulkCancelSubscriptions
 */
export const bulkCancelSubscriptionsSchema = yup.object({
  context: yup.mixed().required(),
  stripeSubscriptionIds: yup.array().of(yup.string().required()).min(1).required(),
}).noUnknown(false);

// --- Query Schemas ---

/**
 * Schema for getOrCreateCustomer
 */
export const getOrCreateCustomerSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  email: yup.string().email().required(),
}).noUnknown(false);

/**
 * Schema for fetchCustomerFromStripe
 */
export const fetchCustomerFromStripeSchema = yup.object({
  context: yup.mixed().required(),
  stripeCustomerId: yup.string().required(),
}).noUnknown(false);

/**
 * Schema for syncInvoices
 */
export const syncInvoicesSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
}).noUnknown(false);

/**
 * Schema for fetchInvoicesFromStripe
 */
export const fetchInvoicesFromStripeSchema = yup.object({
  context: yup.mixed().required(),
  stripeCustomerId: yup.string().required(),
  limit: yup.number().min(1).max(100).default(10),
  startingAfter: yup.string(),
}).noUnknown(false);

/**
 * Schema for searchStripeInvoices
 */
export const searchStripeInvoicesSchema = yup.object({
  context: yup.mixed().required(),
  query: yup.string().required(),
  limit: yup.number().min(1).max(100).default(10),
}).noUnknown(false);
