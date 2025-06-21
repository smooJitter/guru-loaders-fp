// billing-stripe-mutation.actions.js
// Placeholder for billing stripe mutation actions (to be migrated)

import * as R from 'ramda';
import { withNamespace } from '../../../../src/utils/with-namespace.js';

// Local helpers (inlined for modularity)
const sanitizeSubscription = R.omit(['__v']);
const sanitizeInvoice = R.omit(['__v']);
const sanitizeCustomer = R.omit(['__v']);
const sanitizePaymentMethod = R.omit(['__v']);

const createSubscription = async ({ context, userId, planId, paymentMethodId }) => {
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
  return sanitizeSubscription(sub.toObject ? sub.toObject() : sub);
};

const cancelSubscription = async ({ context, stripeSubscriptionId }) => {
  const { services, models } = context;
  await services.stripe.subscriptions.del(stripeSubscriptionId);
  const sub = await models.Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
    { new: true }
  ).lean().exec();
  return sub ? sanitizeSubscription(sub) : null;
};

const updateSubscriptionInStripe = async ({ context, stripeSubscriptionId, updates }) => {
  const { services, models } = context;
  const stripeSub = await services.stripe.subscriptions.update(stripeSubscriptionId, updates);
  const sub = await models.Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    { $set: { ...updates, status: stripeSub.status } },
    { new: true }
  ).lean().exec();
  return sub ? sanitizeSubscription(sub) : null;
};

const attachPaymentMethod = async ({ context, userId, paymentMethodId }) => {
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

const detachPaymentMethod = async ({ context, paymentMethodId }) => {
  const { services, models } = context;
  await services.stripe.paymentMethods.detach(paymentMethodId);
  const method = await models.PaymentMethod.findByIdAndUpdate(
    paymentMethodId,
    { $unset: { userId: '' } },
    { new: true }
  ).lean().exec();
  return method ? sanitizePaymentMethod(method) : null;
};

const refundInvoice = async ({ context, stripeInvoiceId, amount }) => {
  const { services } = context;
  const invoice = await services.stripe.invoices.retrieve(stripeInvoiceId);
  if (!invoice.payment_intent) throw new Error('No payment intent for invoice');
  const refund = await services.stripe.refunds.create({
    payment_intent: invoice.payment_intent,
    amount
  });
  return refund;
};

const bulkCancelSubscriptions = async ({ context, stripeSubscriptionIds }) => {
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
