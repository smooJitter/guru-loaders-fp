import * as yup from 'yup';

/**
 * Validation schemas for billing/payment-method
 */

export const createPaymentMethodSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  stripePaymentMethodId: yup.string().required(),
  isDefault: yup.boolean().default(false),
  paymentMethodType: yup.string().oneOf(['credit card', 'paypal']).required(),
}).noUnknown(false);

export const getPaymentMethodByIdSchema = yup.object({
  context: yup.mixed().required(),
  paymentMethodId: yup.string().required(),
}).noUnknown(false);

export const bulkImportPaymentMethodsSchema = yup.object({
  context: yup.mixed().required(),
  paymentMethods: yup.array().of(
    yup.object({
      userId: yup.string().required(),
      stripePaymentMethodId: yup.string().required(),
      isDefault: yup.boolean().default(false),
      paymentMethodType: yup.string().oneOf(['credit card', 'paypal']).required(),
    })
  ).min(1).required(),
}).noUnknown(false);
