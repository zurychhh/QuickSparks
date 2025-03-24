/**
 * Standard error handling middleware for QuickSparks services
 * 
 * Provides consistent error responses across all services.
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
    return new ApiError(401, message, code, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details = null) {
    return new ApiError(403, message, code, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
    return new ApiError(404, message, code, details);
  }

  static methodNotAllowed(message = 'Method not allowed', code = 'METHOD_NOT_ALLOWED', details = null) {
    return new ApiError(405, message, code, details);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details = null) {
    return new ApiError(409, message, code, details);
  }

  static unprocessableEntity(message = 'Unprocessable Entity', code = 'UNPROCESSABLE_ENTITY', details = null) {
    return new ApiError(422, message, code, details);
  }

  static tooManyRequests(message = 'Too many requests', code = 'TOO_MANY_REQUESTS', details = null) {
    return new ApiError(429, message, code, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR', details = null) {
    return new ApiError(500, message, code, details);
  }
}

/**
 * Error handling middleware for Express
 */
function errorHandler(err, req, res, next) {
  // Get logger from request context
  const logger = req.logger || console;

  // If error was thrown by us, use its code. Otherwise, default to 500
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const errorCode = err instanceof ApiError ? err.code : 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';
  const details = err instanceof ApiError ? err.details : null;

  // Log the error
  if (statusCode >= 500) {
    logger.error(`Error: ${message}`, {
      error: err,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      requestId: req.id,
    });
  } else {
    logger.warn(`Error: ${message}`, {
      error: err,
      url: req.originalUrl,
      method: req.method,
      requestId: req.id,
    });
  }

  // Send the response
  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message,
    details,
    requestId: req.id,
  });
}

module.exports = {
  errorHandler,
  ApiError,
};