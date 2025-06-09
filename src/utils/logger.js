import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  isDev
    ? { transport: { target: 'pino-pretty' } }
    : undefined
);

export default logger; 