import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, err);
    
    if (err instanceof ValidationError && err.details) {
      const response = {
        success: false,
        error: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
      };
      res.status(err.statusCode).json(response);
      return;
    }
    
    sendError(res, err.message, err.statusCode);
    return;
  }

  logger.error('Unhandled error', err);
  sendError(res, 'Internal server error', 500);
}

