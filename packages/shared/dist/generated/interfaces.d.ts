export interface ServiceStatusResponse {
    /** The status of the service */
    status: 'online' | 'offline';
    /** The name of the service */
    service: string;
}
export interface ErrorResponse {
    /** Error message */
    error: string;
}
export interface RegisterRequest {
    /** Username for the new account */
    username: string;
    /** Password for the new account */
    password: string;
    /** Email address for the new account */
    email: string;
}
export interface LoginRequest {
    /** Username for authentication */
    username: string;
    /** Password for authentication */
    password: string;
}
export interface ValidateTokenRequest {
    /** JWT token to validate */
    token: string;
}
export interface UserResponse {
    /** User ID */
    id: number;
    /** Username */
    username: string;
    /** User email address */
    email: string;
    /** Account creation timestamp */
    createdAt: string;
}
export interface LoginResponse {
    /** User ID */
    id: number;
    /** Username */
    username: string;
    /** User email address */
    email: string;
    /** Account creation timestamp */
    createdAt: string;
    /** JWT authentication token */
    token: string;
}
export interface TokenValidationResponse_User {
    /** User ID from the token */
    userId: number;
    /** Username from the token */
    username: string;
}
export interface TokenValidationResponse {
    /** Whether the token is valid */
    valid: boolean;
    /** User information extracted from the token */
    user: TokenValidationResponse_User;
}
export interface PdfConvertRequest {
    /** Text content to convert to PDF */
    text: string;
}
export interface PdfConvertResponse {
    /** URL to download the generated PDF */
    url: string;
    /** Name of the generated PDF file */
    fileName: string;
    /** Success message */
    message: string;
}
export interface QrGenerateRequest {
    /** Text or URL to encode in the QR code */
    text: string;
    /** Size of the QR code in pixels (optional) */
    size?: number | null;
    /** Color of the dark modules (optional) */
    dark?: string | null;
    /** Color of the light modules (optional) */
    light?: string | null;
}
export interface QrGenerateResponse {
    /** URL to download the QR code image */
    url: string;
    /** Base64 data URL of the QR code */
    qr: string;
    /** Name of the generated QR code file */
    fileName: string;
    /** Success message */
    message: string;
}
export interface ImageConvertResponse {
    /** URL to download the processed image */
    url: string;
    /** Name of the processed image file */
    fileName: string;
    /** Width of the processed image in pixels */
    width: number;
    /** Format of the processed image */
    format: string;
    /** Success message */
    message: string;
}
