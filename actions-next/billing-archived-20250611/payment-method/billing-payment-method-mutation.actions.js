// billing-payment-method-mutation.actions.js
// Placeholder for billing payment method mutation actions (to be migrated)

// Define configuration and library-specific logic at the top
const ERRORS = {
  INVALID_PAYMENT_METHOD: (msg) => `Invalid payment method: ${msg}`,
  PAYMENT_METHOD_NOT_FOUND: 'Payment method not found',
  INVALID_INPUT: 'Invalid input',
};

const sanitizePaymentMethod = (method) => {
  if (!method) return method;
  const { __v, ...rest } = method;
  return rest;
};

const validatePaymentMethod = (data) => {
  if (!data || typeof data !== 'object' || !data.userId || !data.stripePaymentMethodId) {
    return { isLeft: true, error: ERRORS.INVALID_PAYMENT_METHOD('Missing required fields') };
  }
  return { isLeft: false };
};

const validatePaymentMethodUpdate = (data) => {
  if (!data || typeof data !== 'object') {
    return { isLeft: true, error: ERRORS.INVALID_PAYMENT_METHOD('Invalid update data') };
  }
  return { isLeft: false };
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const addPaymentMethod = async ({ context, ...data }) => {
  const { PaymentMethod } = context.models;
  const validated = validatePaymentMethod(data);
  if (validated.isLeft) throw new Error(validated.error);
  const method = await new PaymentMethod(data).save();
  return sanitizePaymentMethod(method.toObject());
};

const setDefaultPaymentMethod = async ({ context, userId, paymentMethodId }) => {
  const { PaymentMethod } = context.models;
  await PaymentMethod.updateMany(
    { userId, isDefault: true },
    { $set: { isDefault: false } }
  );
  const updated = await PaymentMethod.findByIdAndUpdate(
    paymentMethodId,
    { $set: { isDefault: true } },
    { new: true }
  ).lean().exec();
  if (!updated) throw new Error(ERRORS.PAYMENT_METHOD_NOT_FOUND);
  return sanitizePaymentMethod(updated);
};

const updatePaymentMethod = async ({ context, id, data }) => {
  const { PaymentMethod } = context.models;
  const validated = validatePaymentMethodUpdate(data);
  if (validated.isLeft) throw new Error(validated.error);
  const method = await PaymentMethod.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean().exec();
  if (!method) throw new Error(ERRORS.PAYMENT_METHOD_NOT_FOUND);
  return sanitizePaymentMethod(method);
};

const deletePaymentMethod = async ({ context, id }) => {
  const { PaymentMethod } = context.models;
  const method = await PaymentMethod.findByIdAndUpdate(
    id,
    { $set: { deletedAt: new Date(), isActive: false } },
    { new: true }
  ).lean().exec();
  if (!method) throw new Error(ERRORS.PAYMENT_METHOD_NOT_FOUND);
  return sanitizePaymentMethod(method);
};

const restorePaymentMethod = async ({ context, id }) => {
  const { PaymentMethod } = context.models;
  const method = await PaymentMethod.findByIdAndUpdate(
    id,
    { $set: { deletedAt: null, isActive: true } },
    { new: true }
  ).lean().exec();
  if (!method) throw new Error(ERRORS.PAYMENT_METHOD_NOT_FOUND);
  return sanitizePaymentMethod(method);
};

const bulkSetDefaultPaymentMethods = async ({ context, userId, ids }) => {
  const { PaymentMethod } = context.models;
  await PaymentMethod.updateMany(
    { userId },
    { $set: { isDefault: false } }
  );
  const result = await PaymentMethod.updateMany(
    { _id: { $in: ids }, userId },
    { $set: { isDefault: true } }
  );
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount
  };
};

export default withNamespace('billingPaymentMethod', {
  addPaymentMethod,
  setDefaultPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  restorePaymentMethod,
  bulkSetDefaultPaymentMethods
});
