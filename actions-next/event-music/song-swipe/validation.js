import * as yup from 'yup';

export const createSwipeSchema = yup.object({
  context: yup.mixed().required(),
  userId: yup.string().required(),
  songId: yup.string().required(),
  reason: yup.string(),
  location: yup.string(),
  event: yup.string()
}).noUnknown(false);

export const bulkCreateSwipesSchema = yup.object({
  context: yup.mixed().required(),
  swipes: yup.array().of(
    yup.object({
      userId: yup.string().required(),
      songId: yup.string().required(),
      direction: yup.string().oneOf(['right', 'left', 'up']).required(),
      reason: yup.string(),
      location: yup.string(),
      event: yup.string()
    })
  ).min(1).required()
}).noUnknown(false);

export const undoSwipeSchema = yup.object({
  context: yup.mixed().required(),
  swipeId: yup.string().required()
}).noUnknown(false); 