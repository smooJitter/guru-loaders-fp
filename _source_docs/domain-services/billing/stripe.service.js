import stripe from '../lib/stripeClient.js';
import Customer from '../models/Customer.js';
import Subscription from '../models/Subscription.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Invoice from '../models/Invoice.js';

/**
 * Get or create Stripe customer for user.
 */
export async function getOrCreateCustomer(user) {
  let customer = await Customer.findOne({ userId: user._id });
  if (customer) return customer;

  const stripeCustomer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user._id.toString() }
  });

  return Customer.create({
    userId: user._id,
    stripeCustomerId: stripeCustomer.id
  });
}

/**
 * Attach a payment method to user.
 */
export async function attachPaymentMethod(user, paymentMethodId, makeDefault = false) {
  const customer = await getOrCreateCustomer(user);

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customer.stripeCustomerId
  });

  if (makeDefault) {
    await stripe.customers.update(customer.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });
    await PaymentMethod.updateMany({ userId: user._id }, { isDefault: false });
  }

  return PaymentMethod.create({
    userId: user._id,
    stripePaymentMethodId: paymentMethodId,
    isDefault: makeDefault
  });
}

/**
 * Create a subscription for a user.
 */
export async function createSubscription(user, plan) {
  const customer = await getOrCreateCustomer(user);

  const stripeSub = await stripe.subscriptions.create({
    customer: customer.stripeCustomerId,
    items: [{ price: plan.stripePriceId }],
    expand: ['latest_invoice.payment_intent']
  });

  return Subscription.create({
    userId: user._id,
    planId: plan._id,
    stripeSubscriptionId: stripeSub.id,
    status: stripeSub.status,
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSub.cancel_at_period_end
  });
}

/**
 * Cancel user's subscription at period end.
 */
export async function cancelSubscription(user) {
  const subscription = await Subscription.findOne({ userId: user._id, status: 'active' });
  if (!subscription) throw new Error('No active subscription found');

  const stripeSub = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true
  });

  subscription.status = stripeSub.status;
  subscription.cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
  return subscription.save();
}

/**
 * Sync Stripe invoices into your Invoice collection.
 */
export async function syncInvoices(user) {
  const customer = await Customer.findOne({ userId: user._id });
  if (!customer) throw new Error('No Stripe customer found');

  const stripeInvoices = await stripe.invoices.list({
    customer: customer.stripeCustomerId,
    limit: 100
  });

  const bulkOps = stripeInvoices.data.map(inv => ({
    updateOne: {
      filter: { stripeInvoiceId: inv.id },
      update: {
        userId: user._id,
        amountDue: inv.amount_due,
        status: inv.status,
        periodStart: new Date(inv.period_start * 1000),
        periodEnd: new Date(inv.period_end * 1000),
        createdAt: new Date(inv.created * 1000),
        paidAt: inv.status === 'paid'
          ? new Date(inv.status_transitions.paid_at * 1000)
          : null
      },
      upsert: true
    }
  }));

  await Invoice.bulkWrite(bulkOps);
  return Invoice.find({ userId: user._id }).sort({ createdAt: -1 });
} 