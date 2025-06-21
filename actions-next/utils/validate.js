import * as yup from 'yup';

export const validate = async (schema, data) => {
  try {
    return await schema.validate(data, { abortEarly: false, stripUnknown: true });
  } catch (err) {
    const details = Array.isArray(err.errors) && err.errors.length
      ? err.errors.join('; ')
      : err.message || 'Invalid input';
    throw new Error(details);
  }
}; 