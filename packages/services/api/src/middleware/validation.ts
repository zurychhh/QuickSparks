import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/errorHandler';

/**
 * Format Zod validation errors into a readable format
 * 
 * @param error Zod error object
 * @returns Record of field names and associated error messages
 */
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const formattedErrors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    // Get the field path (e.g., "body.email" or "params.id")
    const path = err.path.join('.');
    const fieldName = path.includes('.') ? path.split('.').slice(1).join('.') : path;
    
    if (!formattedErrors[fieldName]) {
      formattedErrors[fieldName] = [];
    }
    
    formattedErrors[fieldName].push(err.message);
  });
  
  return formattedErrors;
};

/**
 * Validate request against Zod schema
 * 
 * @param schema Zod schema to validate against
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      next();
    } catch (error) {
      // Format Zod validation errors
      if (error instanceof ZodError) {
        const formattedErrors = formatZodErrors(error);
        next(new ApiError('Validation failed', 400, formattedErrors));
      } else {
        next(error);
      }
    }
  };
};