import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url, ip, requestId } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    if (isDevelopment || duration > 1000 || statusCode >= 400) {
      logger.info(`${method} ${url} ${statusCode} - ${duration}ms`, { ip, requestId });
    }
  });

  next();
}

