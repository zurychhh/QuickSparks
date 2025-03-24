import { JSONSchemaType } from 'ajv';
import { ServiceStatusResponse } from './auth.schema';
export interface QrGenerateRequest {
    text: string;
    size?: number;
    dark?: string;
    light?: string;
}
export declare const qrGenerateRequestSchema: JSONSchemaType<QrGenerateRequest>;
export interface QrGenerateResponse {
    url: string;
    qr: string;
    fileName: string;
    message: string;
}
export declare const qrGenerateResponseSchema: JSONSchemaType<QrGenerateResponse>;
export { ServiceStatusResponse };
