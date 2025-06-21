import { withNamespace } from '../../../src/utils/with-namespace.js';
import { validate } from '../../utils/validate.js';
import {
  createSubscriptionSchema,
  cancelSubscriptionSchema,
  updateSubscriptionInStripeSchema,
  attachPaymentMethodSchema,
  detachPaymentMethodSchema,
  refundInvoiceSchema,
  bulkCancelSubscriptionsSchema
} from './validation.js';

// Local helpers (plain JS, no Ramda)
const omit = (obj, keys) => {
  const result = { ...obj };
  for (const key of keys) delete result[key];
  return result;
};
const sanitizeSubscription = (sub) => sub ? omit(sub, ['__v']) : sub;
const sanitizeInvoice = (inv) => inv ? omit(inv, ['__v']) : inv;
const sanitizeCustomer = (cust) => cust ? omit(cust, ['__v']) : cust;
const sanitizePaymentMethod = (pm) => pm ? omit(pm, ['__v']) : pm;

/**
 * Create a new subscription in Stripe and local DB
 * @param {object} input - { context, userId, planId, paymentMethodId }
 * @returns {Promise<object>} The created subscription object
 */
const createSubscription = async ({ context, userId, planId, paymentMethodId }) => {
  await validate(createSubscriptionSchema, { context, userId, planId, paymentMethodId });
  const { services, models } = context;
  let customer = await models.Customer.findOne({ userId });
  if (!customer) throw new Error('Customer not found');
  const stripeSub = await services.stripe.subscriptions.create({
    customer: customer.stripeCustomerId,
    items: [{ plan: planId }],
    default_payment_method: paymentMethodId
  });
  const sub = await models.Subscription.create({
    userId,
    planId,
    paymentMethodId,
    stripeSubscriptionId: stripeSub.id,
    status: stripeSub.status
  });
  if (!sub) return undefined;
  return sanitizeSubscription(sub.toObject ? sub.toObject() : sub);
};

/**
 * Cancel a subscription in Stripe and update local DB
 * @param {object} input - { context, stripeSubscriptionId }
 * @returns {Promise<object|null>} The cancelled subscription object or null
 */
const cancelSubscription = async ({ context, stripeSubscriptionId }) => {
  await validate(cancelSubscriptionSchema, { context, stripeSubscriptionId });
  const { services, models } = context;
  await services.stripe.subscriptions.del(stripeSubscriptionId);
  const sub = await models.Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { new: true }
  ).lean().exec();
  return sub ? sanitizeSubscription(sub) : null;
};

/**
 * Update a subscription in Stripe and local DB
 * @param {object} input - { context, stripeSubscriptionId, updates }
 * @returns {Promise<object|null>} The updated subscription object or null
 */
const updateSubscriptionInStripe = async ({ context, stripeSubscriptionId, updates }) => {
  await validate(updateSubscriptionInStripeSchema, { context, stripeSubscriptionId, updates });
  const { services, models } = context;
  const stripeSub = await services.stripe.subscriptions.update(stripeSubscriptionId, updates);
  const sub = await models.Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { ...updates, status: stripeSub.status } },
    { new: true }
  ).lean().exec();
  return sub ? sanitizeSubscription(sub) : null;
};

/**
 * Attach a payment method to a customer in Stripe and update local DB
 * @param {object} input - { context, userId, paymentMethodId }
 * @returns {Promise<object|null>} The updated payment method object or null
 */
const attachPaymentMethod = async ({ context, userId, paymentMethodId }) => {
  await validate(attachPaymentMethodSchema, { context, userId, paymentMethodId });
  const { services, models } = context;
  let customer = await models.Customer.findOne({ userId });
  if (!customer) throw new Error('Customer not found');
  await services.stripe.paymentMethods.attach(paymentMethodId, { customer: customer.stripeCustomerId });
  const method = await models.PaymentMethod.findByIdAndUpdate(
    paymentMethodId,
    { $set: { userId } },
    { new: true }
  ).lean().exec();
  return method ? sanitizePaymentMethod(method) : null;
};

/**
 * Detach a payment method from a customer in Stripe and update local DB
 * @param {object} input - { context, paymentMethodId }
 * @returns {Promise<object|null>} The updated payment method object or null
 */
const detachPaymentMethod = async ({ context, paymentMethodId }) => {
  await validate(detachPaymentMethodSchema, { context, paymentMethodId });
  const { services, models } = context;
  await services.stripe.paymentMethods.detach(paymentMethodId);
  const method = await models.PaymentMethod.findByIdAndUpdate(
    paymentMethodId,
    { $unset: { userId: '' } },
    { new: true }
  ).lean().exec();
  return method ? sanitizePaymentMethod(method) : null;
};

/**
 * Refund a Stripe invoice
 * @param {object} input - { context, stripeInvoiceId, amount }
 * @returns {Promise<object>} The refund object
 */
const refundInvoice = async ({ context, stripeInvoiceId, amount }) => {
  await validate(refundInvoiceSchema, { context, stripeInvoiceId, amount });
  const { services } = context;
  const invoice = await services.stripe.invoices.retrieve(stripeInvoiceId);
  if (!invoice.payment_intent) throw new Error('No payment intent for invoice');
  const refund = await services.stripe.refunds.create({
    payment_intent: invoice.payment_intent,
    amount
  });
  return refund;
};

/**
 * Bulk cancel subscriptions in Stripe and update local DB
 * @param {object} input - { context, stripeSubscriptionIds }
 * @returns {Promise<object[]>} Array of cancelled subscription objects
 */
const bulkCancelSubscriptions = async ({ context, stripeSubscriptionIds }) => {
  await validate(bulkCancelSubscriptionsSchema, { context, stripeSubscriptionIds });
  const { services, models } = context;
  const results = await Promise.all(stripeSubscriptionIds.map(async (id) => {
    await services.stripe.subscriptions.del(id);
    return models.Subscription.findOneAndUpdate(
      { stripeSubscriptionId: id },
      { $set: { status: 'cancelled', cancelledAt: new Date() } },
      { new: true }
    ).lean().exec();
  }));
  return results.filter(Boolean).map(sanitizeSubscription);
};

export default withNamespace('billingStripe', {
  createSubscription,
  cancelSubscription,
  updateSubscriptionInStripe,
  attachPaymentMethod,
  detachPaymentMethod,
  refundInvoice,
  bulkCancelSubscriptions
});

export { sanitizeSubscription, sanitizeInvoice, sanitizeCustomer, sanitizePaymentMethod }; 