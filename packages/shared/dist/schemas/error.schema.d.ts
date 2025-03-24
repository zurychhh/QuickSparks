import { JSONSchemaType } from 'ajv';
export interface ErrorResponse {
    error: string;
}
export declare const errorResponseSchema: JSONSchemaType<ErrorResponse>;
