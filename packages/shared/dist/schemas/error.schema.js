"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponseSchema = void 0;
exports.errorResponseSchema = {
    type: 'object',
    properties: {
        error: { type: 'string' }
    },
    required: ['error'],
    additionalProperties: false
};
