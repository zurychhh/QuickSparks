import { JSONSchemaType } from 'ajv';
export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
}
export declare const registerRequestSchema: JSONSchemaType<RegisterRequest>;
export interface LoginRequest {
    username: string;
    password: string;
}
export declare const loginRequestSchema: JSONSchemaType<LoginRequest>;
export interface ValidateTokenRequest {
    token: string;
}
export declare const validateTokenRequestSchema: JSONSchemaType<ValidateTokenRequest>;
export interface UserResponse {
    id: number;
    username: string;
    email: string;
    createdAt: string;
}
export declare const userResponseSchema: JSONSchemaType<UserResponse>;
export interface LoginResponse extends UserResponse {
    token: string;
}
export declare const loginResponseSchema: JSONSchemaType<LoginResponse>;
export interface TokenValidationResponse {
    valid: boolean;
    user: {
        userId: number;
        username: string;
    };
}
export declare const tokenValidationResponseSchema: JSONSchemaType<TokenValidationResponse>;
export interface ServiceStatusResponse {
    status: 'online' | 'offline';
    service: string;
}
export declare const serviceStatusResponseSchema: JSONSchemaType<ServiceStatusResponse>;
