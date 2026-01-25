import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof AppError) {
    logger.warn('Application error', {
      statusCode: error.statusCode,
      message: error.message,
      path: req.path,
    });

    res.status(error.statusCode).json({
      error: error.message,
    });
    return;
  }

  // Log unexpected errors
  logger.error('Unexpected error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
  });

  res.status(500).json({
    error: 'Internal server error',
  });
};
