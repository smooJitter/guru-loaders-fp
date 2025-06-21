import * as yup from 'yup';

/**
 * Validation schemas for billing/customer
 */

export const createCustomerSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  stripeCustomerId: yup.string().required(),
  billingAddress: yup.string(),
}).noUnknown(false);

export const getCustomerByIdSchema = yup.object({
  context: yup.mixed().required(),
  customerId: yup.string().required(),
}).noUnknown(false);

export const bulkImportCustomersSchema = yup.object({
  context: yup.mixed().required(),
  customers: yup.array().of(
    yup.object({
      userId: yup.string().required(),
      stripeCustomerId: yup.string().required(),
      billingAddress: yup.string(),
    })
  ).min(1).required(),
}).noUnknown(false);

export const getCustomerByStripeIdSchema = yup.object({
  context: yup.mixed().required(),
  stripeCustomerId: yup.string().required(),
}).noUnknown(false);

export const getCustomersByUserSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
}).noUnknown(false);

export const listActiveCustomersSchema = yup.object({
  context: yup.mixed().required(),
  limit: yup.number().min(1).max(100).default(20),
  offset: yup.number().min(0).default(0),
}).noUnknown(false);

export const listDeletedCustomersSchema = yup.object({
  context: yup.mixed().required(),
  limit: yup.number().min(1).max(100).default(20),
  offset: yup.number().min(0).default(0),
}).noUnknown(false);

export const searchCustomersSchema = yup.object({
  context: yup.mixed().required(),
  query: yup.string().required(),
  limit: yup.number().min(1).max(100).default(20),
  offset: yup.number().min(0).default(0),
  status: yup.string().oneOf(['ACTIVE', 'DELETED', 'SUSPENDED']).optional(),
}).noUnknown(false);

export const getCustomerByEmailSchema = yup.object({
  context: yup.mixed().required(),
  email: yup.string().email().required(),
}).noUnknown(false);

export const getCustomersByStatusSchema = yup.object({
  context: yup.mixed().required(),
  status: yup.string().oneOf(['ACTIVE', 'DELETED', 'SUSPENDED']).required(),
  limit: yup.number().min(1).max(100).default(20),
  offset: yup.number().min(0).default(0),
}).noUnknown(false);
