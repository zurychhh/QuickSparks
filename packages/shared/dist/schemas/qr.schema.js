"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrGenerateResponseSchema = exports.qrGenerateRequestSchema = void 0;
exports.qrGenerateRequestSchema = {
    type: 'object',
    properties: {
        text: { type: 'string', minLength: 1 },
        size: { type: 'number', nullable: true },
        dark: { type: 'string', nullable: true },
        light: { type: 'string', nullable: true }
    },
    required: ['text'],
    additionalProperties: false
};
exports.qrGenerateResponseSchema = {
    type: 'object',
    properties: {
        url: { type: 'string' },
        qr: { type: 'string' },
        fileName: { type: 'string' },
        message: { type: 'string' }
    },
    required: ['url', 'qr', 'fileName', 'message'],
    additionalProperties: false
};
