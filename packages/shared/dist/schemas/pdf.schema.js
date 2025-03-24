"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfConvertResponseSchema = exports.pdfConvertRequestSchema = void 0;
exports.pdfConvertRequestSchema = {
    type: 'object',
    properties: {
        text: { type: 'string', minLength: 1 }
    },
    required: ['text'],
    additionalProperties: false
};
exports.pdfConvertResponseSchema = {
    type: 'object',
    properties: {
        url: { type: 'string' },
        fileName: { type: 'string' },
        message: { type: 'string' }
    },
    required: ['url', 'fileName', 'message'],
    additionalProperties: false
};
