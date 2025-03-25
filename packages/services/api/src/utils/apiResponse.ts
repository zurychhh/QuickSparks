import { Response } from 'express';

/**
 * Standard API response structure
 */
interface ApiResponseData {
  status: 'success' | 'error';
  message?: string;
  data?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Send a success response
 * 
 * @param res Express response object
 * @param data Response data
 * @param message Success message
 * @param statusCode HTTP status code (default: 200)
 */
export const successResponse = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponseData['meta']
): Response => {
  const responseBody: ApiResponseData = {
    status: 'success',
    message,
    data,
  };

  if (meta) {
    responseBody.meta = meta;
  }

  return res.status(statusCode).json(responseBody);
};

/**
 * Send an error response
 * 
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 400)
 * @param data Additional error data
 */
export const errorResponse = (
  res: Response,
  message = 'Error',
  statusCode = 400,
  data?: unknown
): Response => {
  const responseBody: ApiResponseData = {
    status: 'error',
    message,
  };

  if (data) {
    responseBody.data = data;
  }

  return res.status(statusCode).json(responseBody);
};