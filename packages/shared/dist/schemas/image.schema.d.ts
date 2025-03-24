import { JSONSchemaType } from 'ajv';
import { ServiceStatusResponse } from './auth.schema';
export interface ImageConvertResponse {
    url: string;
    fileName: string;
    width: number;
    format: string;
    message: string;
}
export declare const imageConvertResponseSchema: JSONSchemaType<ImageConvertResponse>;
export declare enum ImageFormat {
    JPEG = "jpeg",
    PNG = "png",
    WEBP = "webp",
    AVIF = "avif"
}
export { ServiceStatusResponse };
