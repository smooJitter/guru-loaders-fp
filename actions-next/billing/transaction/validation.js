import * as yup from 'yup';

/**
 * Validation schemas for billing/transaction
 */

export const createTransactionSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  amount: yup.number().required(),
  currency: yup.string().required(),
  status: yup.string().oneOf(['pending', 'completed', 'failed']).default('pending'),
  paymentMethodId: yup.string().required(),
  relatedInvoiceId: yup.string(),
  transactionId: yup.string().required(),
  metadata: yup.object(),
}).noUnknown(false);

export const getTransactionByIdSchema = yup.object({
  context: yup.mixed().required(),
  transactionId: yup.string().required(),
}).noUnknown(false);

export const bulkImportTransactionsSchema = yup.object({
  context: yup.mixed().required(),
  transactions: yup.array().of(
    yup.object({
      userId: yup.string().required(),
      amount: yup.number().required(),
      currency: yup.string().required(),
      status: yup.string().oneOf(['pending', 'completed', 'failed']).default('pending'),
      paymentMethodId: yup.string().required(),
      relatedInvoiceId: yup.string(),
      transactionId: yup.string().required(),
      metadata: yup.object(),
    })
  ).min(1).required(),
}).noUnknown(false); 