import { JSONSchemaType } from 'ajv';

// Auth request schemas
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export const registerRequestSchema: JSONSchemaType<RegisterRequest> = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 50 },
    password: { type: 'string', minLength: 8, maxLength: 100 },
    email: { type: 'string', format: 'email', maxLength: 100 }
  },
  required: ['username', 'password', 'email'],
  additionalProperties: false
};

export interface LoginRequest {
  username: string;
  password: string;
}

export const loginRequestSchema: JSONSchemaType<LoginRequest> = {
  type: 'object',
  properties: {
    username: { type: 'string' },
    password: { type: 'string' }
  },
  required: ['username', 'password'],
  additionalProperties: false
};

export interface ValidateTokenRequest {
  token: string;
}

export const validateTokenRequestSchema: JSONSchemaType<ValidateTokenRequest> = {
  type: 'object',
  properties: {
    token: { type: 'string' }
  },
  required: ['token'],
  additionalProperties: false
};

// Auth response schemas
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export const userResponseSchema: JSONSchemaType<UserResponse> = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    username: { type: 'string' },
    email: { type: 'string', format: 'email' },
    createdAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'username', 'email', 'createdAt'],
  additionalProperties: false
};

export interface LoginResponse extends UserResponse {
  token: string;
}

export const loginResponseSchema: JSONSchemaType<LoginResponse> = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    username: { type: 'string' },
    email: { type: 'string', format: 'email' },
    createdAt: { type: 'string', format: 'date-time' },
    token: { type: 'string' }
  },
  required: ['id', 'username', 'email', 'createdAt', 'token'],
  additionalProperties: false
};

export interface TokenValidationResponse {
  valid: boolean;
  user: {
    userId: number;
    username: string;
  };
}

export const tokenValidationResponseSchema: JSONSchemaType<TokenValidationResponse> = {
  type: 'object',
  properties: {
    valid: { type: 'boolean' },
    user: {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        username: { type: 'string' }
      },
      required: ['userId', 'username'],
      additionalProperties: false
    }
  },
  required: ['valid', 'user'],
  additionalProperties: false
};

// Service status response
export interface ServiceStatusResponse {
  status: 'online' | 'offline';
  service: string;
}

export const serviceStatusResponseSchema: JSONSchemaType<ServiceStatusResponse> = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['online', 'offline'] },
    service: { type: 'string' }
  },
  required: ['status', 'service'],
  additionalProperties: false
};