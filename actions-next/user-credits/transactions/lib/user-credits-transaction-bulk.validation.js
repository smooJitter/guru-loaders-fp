import * as yup from 'yup';

/**
 * Schema for bulk creating credit transactions
 * transactions: array of { userId, amount, type, ... }
 */
export const bulkCreateTransactionsSchema = yup.object({
  transactions: yup.array().of(
    yup.object({
      userId: yup.string().required(),
      amount: yup.number().required(),
      type: yup.string().required(),
      referenceId: yup.string().optional(),
      description: yup.string().optional(),
      fromUserId: yup.string().optional(),
      toUserId: yup.string().optional(),
      reason: yup.string().optional(),
      stripeRef: yup.string().optional(),
    })
  ).min(1).required()
});

/**
 * Schema for bulk expiring credits
 * userIds: array of userId strings
 * amount: number
 * reason: optional string
 */
export const bulkExpireCreditsSchema = yup.object({
  userIds: yup.array().of(yup.string().required()).min(1).required(),
  amount: yup.number().required(),
  reason: yup.string().optional(),
});

/**
 * Schema for bulk transferring credits
 * fromUserId: string
 * toUserIds: array of userId strings
 * amountPerUser: number
 * description: optional string
 */
export const bulkTransferCreditsSchema = yup.object({
  fromUserId: yup.string().required(),
  toUserIds: yup.array().of(yup.string().required()).min(1).required(),
  amountPerUser: yup.number().required(),
  description: yup.string().optional(),
}); 