import { JSONSchemaType } from 'ajv';

// Error response schema
export interface ErrorResponse {
  error: string;
}

export const errorResponseSchema: JSONSchemaType<ErrorResponse> = {
  type: 'object',
  properties: {
    error: { type: 'string' }
  },
  required: ['error'],
  additionalProperties: false
};