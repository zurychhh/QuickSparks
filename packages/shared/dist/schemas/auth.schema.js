"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceStatusResponseSchema = exports.tokenValidationResponseSchema = exports.loginResponseSchema = exports.userResponseSchema = exports.validateTokenRequestSchema = exports.loginRequestSchema = exports.registerRequestSchema = void 0;
exports.registerRequestSchema = {
    type: 'object',
    properties: {
        username: { type: 'string', minLength: 3, maxLength: 50 },
        password: { type: 'string', minLength: 8, maxLength: 100 },
        email: { type: 'string', format: 'email', maxLength: 100 }
    },
    required: ['username', 'password', 'email'],
    additionalProperties: false
};
exports.loginRequestSchema = {
    type: 'object',
    properties: {
        username: { type: 'string' },
        password: { type: 'string' }
    },
    required: ['username', 'password'],
    additionalProperties: false
};
exports.validateTokenRequestSchema = {
    type: 'object',
    properties: {
        token: { type: 'string' }
    },
    required: ['token'],
    additionalProperties: false
};
exports.userResponseSchema = {
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
exports.loginResponseSchema = {
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
exports.tokenValidationResponseSchema = {
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
exports.serviceStatusResponseSchema = {
    type: 'object',
    properties: {
        status: { type: 'string', enum: ['online', 'offline'] },
        service: { type: 'string' }
    },
    required: ['status', 'service'],
    additionalProperties: false
};
