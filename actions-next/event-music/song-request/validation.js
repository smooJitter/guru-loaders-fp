import * as yup from 'yup';

export const createRequestFromSwipeSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  songId: yup.string().required(),
  swipeId: yup.string(),
  location: yup.string(),
  event: yup.string()
}).noUnknown(false);

export const approveRequestSchema = yup.object({
  context: yup.mixed().required(),
  requestId: yup.string().required()
}).noUnknown(false);

export const rejectRequestSchema = yup.object({
  context: yup.mixed().required(),
  requestId: yup.string().required(),
  reason: yup.string()
}).noUnknown(false);

export const markRequestAsPlayedSchema = yup.object({
  context: yup.mixed().required(),
  requestId: yup.string().required()
}).noUnknown(false);

export const bulkApproveRequestsSchema = yup.object({
  context: yup.mixed().required(),
  ids: yup.array().of(yup.string().required()).min(1).required()
}).noUnknown(false);

export const bulkRejectRequestsSchema = yup.object({
  context: yup.mixed().required(),
  ids: yup.array().of(yup.string().required()).min(1).required()
}).noUnknown(false); 