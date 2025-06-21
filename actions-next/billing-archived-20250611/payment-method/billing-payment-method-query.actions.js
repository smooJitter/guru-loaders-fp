// billing-payment-method-query.actions.js
// Placeholder for billing payment method query actions (to be migrated)

// Define configuration and library-specific logic at the top
const sanitizePaymentMethod = (method) => {
  if (!method) return method;
  const { __v, ...rest } = method;
  return rest;
};

import { withNamespace } from '../../../../src/utils/with-namespace.js';

const getPaymentMethodsByUser = async ({ context, userId }) => {
  const { PaymentMethod } = context.models;
  const methods = await PaymentMethod.find({ userId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return methods.map(sanitizePaymentMethod);
};

const getDefaultPaymentMethod = async ({ context, userId }) => {
  const { PaymentMethod } = context.models;
  const method = await PaymentMethod.findOne({ userId, isDefault: true })
    .lean()
    .exec();
  return method ? sanitizePaymentMethod(method) : null;
};

const getPaymentMethodById = async ({ context, id }) => {
  const { PaymentMethod } = context.models;
  const method = await PaymentMethod.findById(id).lean().exec();
  return method ? sanitizePaymentMethod(method) : null;
};

const searchPaymentMethods = async ({ context, userId, query, limit = 10, offset = 0, cardType, last4 }) => {
  const { PaymentMethod } = context.models;
  const searchQuery = {
    userId,
    ...(cardType ? { cardType } : {}),
    ...(last4 ? { last4 } : {}),
    ...(query ? {
      $or: [
        { cardType: { $regex: query, $options: 'i' } },
        { last4: { $regex: query, $options: 'i' } },
        { billingName: { $regex: query, $options: 'i' } }
      ]
    } : {})
  };
  const [methods, total] = await Promise.all([
    PaymentMethod.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec(),
    PaymentMethod.countDocuments(searchQuery)
  ]);
  return {
    items: methods.map(sanitizePaymentMethod),
    total,
    hasMore: total > offset + methods.length
  };
};

export default withNamespace('billingPaymentMethod', {
  getPaymentMethodsByUser,
  getDefaultPaymentMethod,
  getPaymentMethodById,
  searchPaymentMethods
});
