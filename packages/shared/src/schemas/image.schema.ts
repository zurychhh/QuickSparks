import { JSONSchemaType } from 'ajv';
import { ServiceStatusResponse } from './auth.schema';

// Note: For image upload, we'd typically use multipart/form-data
// which isn't easily represented in JSON Schema. Here we're defining
// the expected form fields as a reference.

// Image response schemas
export interface ImageConvertResponse {
  url: string;
  fileName: string;
  width: number;
  format: string;
  message: string;
}

export const imageConvertResponseSchema: JSONSchemaType<ImageConvertResponse> = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    fileName: { type: 'string' },
    width: { type: 'number' },
    format: { type: 'string' },
    message: { type: 'string' }
  },
  required: ['url', 'fileName', 'width', 'format', 'message'],
  additionalProperties: false
};

// Image format enum
export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  AVIF = 'avif'
}

// Re-export the service status response for Image service
export { ServiceStatusResponse };