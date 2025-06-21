import * as R from 'ramda';

// Remove MongoDB version key from transaction objects
export const sanitizeTransaction = R.omit(['__v']); 