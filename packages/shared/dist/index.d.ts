export * from './generated/interfaces';
export * from './validation/validator';
import * as AuthSchemas from './schemas/auth.schema';
import * as PdfSchemas from './schemas/pdf.schema';
import * as ImageSchemas from './schemas/image.schema';
import * as QrSchemas from './schemas/qr.schema';
import * as ErrorSchemas from './schemas/error.schema';
export { registerRequestSchema, loginRequestSchema, validateTokenRequestSchema, userResponseSchema, loginResponseSchema, tokenValidationResponseSchema, serviceStatusResponseSchema } from './schemas/auth.schema';
export { pdfConvertRequestSchema, pdfConvertResponseSchema } from './schemas/pdf.schema';
export { imageConvertResponseSchema, ImageFormat } from './schemas/image.schema';
export { qrGenerateRequestSchema, qrGenerateResponseSchema } from './schemas/qr.schema';
export { errorResponseSchema } from './schemas/error.schema';
export declare const Validators: {
    Auth: {
        RegisterRequest: (data: unknown) => {
            valid: boolean;
            data?: AuthSchemas.RegisterRequest | undefined;
            errors?: string[];
        };
        LoginRequest: (data: unknown) => {
            valid: boolean;
            data?: AuthSchemas.LoginRequest | undefined;
            errors?: string[];
        };
        ValidateTokenRequest: (data: unknown) => {
            valid: boolean;
            data?: AuthSchemas.ValidateTokenRequest | undefined;
            errors?: string[];
        };
        UserResponse: (data: unknown) => {
            valid: boolean;
            data?: AuthSchemas.UserResponse | undefined;
            errors?: string[];
        };
        LoginResponse: (data: unknown) => {
            valid: boolean;
            data?: AuthSchemas.LoginResponse | undefined;
            errors?: string[];
        };
        TokenValidationResponse: (data: unknown) => {
            valid: boolean;
            data?: AuthSchemas.TokenValidationResponse | undefined;
            errors?: string[];
        };
        ServiceStatusResponse: (data: unknown) => {
            valid: boolean;
            data?: AuthSchemas.ServiceStatusResponse | undefined;
            errors?: string[];
        };
    };
    Pdf: {
        ConvertRequest: (data: unknown) => {
            valid: boolean;
            data?: PdfSchemas.PdfConvertRequest | undefined;
            errors?: string[];
        };
        ConvertResponse: (data: unknown) => {
            valid: boolean;
            data?: PdfSchemas.PdfConvertResponse | undefined;
            errors?: string[];
        };
    };
    Qr: {
        GenerateRequest: (data: unknown) => {
            valid: boolean;
            data?: QrSchemas.QrGenerateRequest | undefined;
            errors?: string[];
        };
        GenerateResponse: (data: unknown) => {
            valid: boolean;
            data?: QrSchemas.QrGenerateResponse | undefined;
            errors?: string[];
        };
    };
    Image: {
        ConvertResponse: (data: unknown) => {
            valid: boolean;
            data?: ImageSchemas.ImageConvertResponse | undefined;
            errors?: string[];
        };
    };
    Error: {
        ErrorResponse: (data: unknown) => {
            valid: boolean;
            data?: ErrorSchemas.ErrorResponse | undefined;
            errors?: string[];
        };
    };
};
