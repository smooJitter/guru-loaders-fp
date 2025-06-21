import * as yup from 'yup';

/**
 * Validation schemas for billing/plan
 */

export const createPlanSchema = yup.object({
  context: yup.mixed().required(),
  name: yup.string().required(),
  stripePriceId: yup.string().required(),
  isActive: yup.boolean().default(true),
  description: yup.string(),
}).noUnknown(false);

export const getPlanByIdSchema = yup.object({
  context: yup.mixed().required(),
  planId: yup.string().required(),
}).noUnknown(false);

export const bulkImportPlansSchema = yup.object({
  context: yup.mixed().required(),
  plans: yup.array().of(
    yup.object({
      name: yup.string().required(),
      stripePriceId: yup.string().required(),
      isActive: yup.boolean().default(true),
      description: yup.string(),
    })
  ).min(1).required(),
}).noUnknown(false);

export const updatePlanSchema = yup.object({
  context: yup.mixed().required(),
  id: yup.string().required(),
  name: yup.string(),
  stripePriceId: yup.string(),
  isActive: yup.boolean(),
  description: yup.string(),
}).noUnknown(false);

export const updatePlanStatusSchema = yup.object({
  context: yup.mixed().required(),
  id: yup.string().required(),
  isActive: yup.boolean().required(),
}).noUnknown(false);

export const bulkUpdatePlansSchema = yup.object({
  context: yup.mixed().required(),
  ids: yup.array().of(yup.string().required()).min(1).required(),
  name: yup.string(),
  stripePriceId: yup.string(),
  isActive: yup.boolean(),
  description: yup.string(),
}).noUnknown(false);

export const getPlanByNameSchema = yup.object({
  context: yup.mixed().required(),
  name: yup.string().required(),
}).noUnknown(false);

export const listActivePlansSchema = yup.object({
  context: yup.mixed().required(),
  limit: yup.number().min(1).max(100).default(20),
  offset: yup.number().min(0).default(0),
}).noUnknown(false);

export const searchPlansSchema = yup.object({
  context: yup.mixed().required(),
  query: yup.string(),
  limit: yup.number().min(1).max(100).default(20),
  offset: yup.number().min(0).default(0),
  isActive: yup.boolean(),
}).noUnknown(false);
