import * as yup from 'yup';

/**
 * Validation schemas for billing/invoice
 */

export const createInvoiceSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  stripeInvoiceId: yup.string().required(),
  amountDue: yup.number().required(),
  status: yup.string().oneOf(['open', 'paid', 'uncollectible', 'void']).default('open'),
  periodStart: yup.date(),
  periodEnd: yup.date(),
  paidAt: yup.date(),
  invoiceId: yup.string().required(),
  metadata: yup.object(),
}).noUnknown(false);

export const getInvoiceByIdSchema = yup.object({
  context: yup.mixed().required(),
  invoiceId: yup.string().required(),
}).noUnknown(false);

export const bulkImportInvoicesSchema = yup.object({
  context: yup.mixed().required(),
  invoices: yup.array().of(
    yup.object({
      userId: yup.string().required(),
      stripeInvoiceId: yup.string().required(),
      amountDue: yup.number().required(),
      status: yup.string().oneOf(['open', 'paid', 'uncollectible', 'void']).default('open'),
      periodStart: yup.date(),
      periodEnd: yup.date(),
      paidAt: yup.date(),
      invoiceId: yup.string().required(),
      metadata: yup.object(),
    })
  ).min(1).required(),
}).noUnknown(false);
