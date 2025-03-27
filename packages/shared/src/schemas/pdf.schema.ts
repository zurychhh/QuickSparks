import { JSONSchemaType } from 'ajv';
import { ServiceStatusResponse } from './auth.schema';

// PDF request schemas
export interface PdfConvertRequest {
  text: string;
}

export const pdfConvertRequestSchema: JSONSchemaType<PdfConvertRequest> = {
  type: 'object',
  properties: {
    text: { type: 'string', minLength: 1 }
  },
  required: ['text'],
  additionalProperties: false
};

// PDF response schemas
export interface PdfConvertResponse {
  url: string;
  fileName: string;
  message: string;
}

export const pdfConvertResponseSchema: JSONSchemaType<PdfConvertResponse> = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    fileName: { type: 'string' },
    message: { type: 'string' }
  },
  required: ['url', 'fileName', 'message'],
  additionalProperties: false
};

// Re-export the service status response for PDF service
export { ServiceStatusResponse };