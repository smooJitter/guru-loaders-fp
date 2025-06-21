/**
 * Validation schemas for user-credits account actions
 * Uses yup for schema validation
 */
import * as yup from 'yup';

/**
 * Example: Account Update Validation Schema
 */
export const accountUpdateSchema = yup.object({
  userId: yup.string().required(),
  email: yup.string().email().optional(),
  balance: yup.number().optional(),
}); 