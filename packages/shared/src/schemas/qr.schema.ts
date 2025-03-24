import { JSONSchemaType } from 'ajv';
import { ServiceStatusResponse } from './auth.schema';

// QR code request schemas
export interface QrGenerateRequest {
  text: string;
  size?: number;
  dark?: string;
  light?: string;
}

export const qrGenerateRequestSchema: JSONSchemaType<QrGenerateRequest> = {
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

// QR code response schemas
export interface QrGenerateResponse {
  url: string;
  qr: string; // Base64 data URL
  fileName: string;
  message: string;
}

export const qrGenerateResponseSchema: JSONSchemaType<QrGenerateResponse> = {
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

// Re-export the service status response for QR service
export { ServiceStatusResponse };