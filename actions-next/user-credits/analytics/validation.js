/**
 * Validation schemas for user-credits analytics actions
 * Uses yup for schema validation
 */
import * as yup from 'yup';

/**
 * Example: Analytics Query Validation Schema
 */
export const analyticsQuerySchema = yup.object({
  userId: yup.string().required(),
  startDate: yup.date().optional(),
  endDate: yup.date().optional(),
}); 