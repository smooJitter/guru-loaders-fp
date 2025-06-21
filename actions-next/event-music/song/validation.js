import * as yup from 'yup';

export const addRatingSchema = yup.object({
  context: yup.mixed().required(),
  id: yup.string().required(),
  rating: yup.object({
    userId: yup.string().required(),
    value: yup.number().min(1).max(5).required(),
    type: yup.string().default('user')
  }).required()
}).noUnknown(false);

export const createSongSchema = yup.object({
  context: yup.mixed().required(),
  title: yup.string().required(),
  artist: yup.string().required(),
  audioFile: yup.object({
    url: yup.string().required(),
    duration: yup.number().required(),
    format: yup.string().required(),
    size: yup.number().required()
  }).required()
}).noUnknown(false);

export const updateSongSchema = yup.object({
  context: yup.mixed().required(),
  id: yup.string().required(),
  update: yup.object().required()
}).noUnknown(false);

export const updateSongStatusSchema = yup.object({
  context: yup.mixed().required(),
  id: yup.string().required(),
  status: yup.string().required()
}).noUnknown(false);

export const deleteSongSchema = yup.object({
  context: yup.mixed().required(),
  id: yup.string().required()
}).noUnknown(false);

export const incrementPlayCountSchema = yup.object({
  context: yup.mixed().required(),
  id: yup.string().required()
}).noUnknown(false);

export const bulkDeleteSongsSchema = yup.object({
  context: yup.mixed().required(),
  ids: yup.array().of(yup.string().required()).min(1).required()
}).noUnknown(false);

export const restoreSongSchema = yup.object({
  context: yup.mixed().required(),
  id: yup.string().required()
}).noUnknown(false); 