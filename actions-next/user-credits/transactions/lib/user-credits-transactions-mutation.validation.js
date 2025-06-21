/**
 * Validation schemas for user-credits transactions actions
 * Uses yup for schema validation
 */
import * as yup from 'yup';

/**
 * Schema for creating a credit transaction
 */
export const creditTransactionSchema = yup.object({
  userId: yup.string().required(),
  amount: yup.number().required(),
  type: yup.string().required(),
  referenceId: yup.string().optional(),
  description: yup.string().optional(),
  fromUserId: yup.string().optional(),
  toUserId: yup.string().optional(),
  reason: yup.string().optional(),
  stripeRef: yup.string().optional(),
});

/**
 * Schema for top up
 */
export const creditTopUpSchema = yup.object({
  userId: yup.string().required(),
  amount: yup.number().required(),
  stripeRef: yup.string().optional(),
});

/**
 * Schema for spending credits
 */
export const spendCreditsSchema = yup.object({
  userId: yup.string().required(),
  amount: yup.number().required(),
  description: yup.string().optional(),
});

/**
 * Schema for refunding credits
 */
export const refundCreditsSchema = yup.object({
  userId: yup.string().required(),
  amount: yup.number().required(),
  referenceId: yup.string().optional(),
  description: yup.string().optional(),
});

/**
 * Schema for expiring credits
 */
export const expireCreditsSchema = yup.object({
  userId: yup.string().required(),
  amount: yup.number().required(),
  reason: yup.string().optional(),
});

/**
 * Schema for transferring credits
 */
export const transferCreditsSchema = yup.object({
  fromUserId: yup.string().required(),
  toUserId: yup.string().required(),
  amount: yup.number().required(),
  description: yup.string().optional(),
}); 