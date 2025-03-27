import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Validators } from '@conversion-microservices/shared';
import { JSONSchemaType } from 'ajv';

/**
 * Middleware factory to validate request body against a schema
 * @param schema The schema validator to use
 * @returns Middleware function
 */
export function validationMiddleware<T>(validator: ReturnType<typeof Validators.Auth.RegisterRequest>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = validator(req.body);
    
    if (result.valid) {
      // Replace request body with validated data
      req.body = result.data;
      next();
    } else {
      // Throw validation error
      throw new BadRequestException({
        error: `Validation failed: ${result.errors?.join(', ')}`,
      });
    }
  };
}

// Create middlewares for each request type
export const RegisterValidationMiddleware = validationMiddleware(Validators.Auth.RegisterRequest);
export const LoginValidationMiddleware = validationMiddleware(Validators.Auth.LoginRequest);
export const ValidateTokenValidationMiddleware = validationMiddleware(Validators.Auth.ValidateTokenRequest);