import { JSONSchemaType } from 'ajv';
import { ServiceStatusResponse } from './auth.schema';
export interface PdfConvertRequest {
    text: string;
}
export declare const pdfConvertRequestSchema: JSONSchemaType<PdfConvertRequest>;
export interface PdfConvertResponse {
    url: string;
    fileName: string;
    message: string;
}
export declare const pdfConvertResponseSchema: JSONSchemaType<PdfConvertResponse>;
export { ServiceStatusResponse };
