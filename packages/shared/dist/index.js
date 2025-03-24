"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validators = exports.errorResponseSchema = exports.qrGenerateResponseSchema = exports.qrGenerateRequestSchema = exports.ImageFormat = exports.imageConvertResponseSchema = exports.pdfConvertResponseSchema = exports.pdfConvertRequestSchema = exports.serviceStatusResponseSchema = exports.tokenValidationResponseSchema = exports.loginResponseSchema = exports.userResponseSchema = exports.validateTokenRequestSchema = exports.loginRequestSchema = exports.registerRequestSchema = void 0;
// Export generated TypeScript interfaces
__exportStar(require("./generated/interfaces"), exports);
// Export validation utilities
__exportStar(require("./validation/validator"), exports);
// Import schemas
const AuthSchemas = __importStar(require("./schemas/auth.schema"));
const PdfSchemas = __importStar(require("./schemas/pdf.schema"));
const ImageSchemas = __importStar(require("./schemas/image.schema"));
const QrSchemas = __importStar(require("./schemas/qr.schema"));
const ErrorSchemas = __importStar(require("./schemas/error.schema"));
const validator_1 = require("./validation/validator");
// Export schemas explicitly to avoid naming conflicts
var auth_schema_1 = require("./schemas/auth.schema");
Object.defineProperty(exports, "registerRequestSchema", { enumerable: true, get: function () { return auth_schema_1.registerRequestSchema; } });
Object.defineProperty(exports, "loginRequestSchema", { enumerable: true, get: function () { return auth_schema_1.loginRequestSchema; } });
Object.defineProperty(exports, "validateTokenRequestSchema", { enumerable: true, get: function () { return auth_schema_1.validateTokenRequestSchema; } });
Object.defineProperty(exports, "userResponseSchema", { enumerable: true, get: function () { return auth_schema_1.userResponseSchema; } });
Object.defineProperty(exports, "loginResponseSchema", { enumerable: true, get: function () { return auth_schema_1.loginResponseSchema; } });
Object.defineProperty(exports, "tokenValidationResponseSchema", { enumerable: true, get: function () { return auth_schema_1.tokenValidationResponseSchema; } });
Object.defineProperty(exports, "serviceStatusResponseSchema", { enumerable: true, get: function () { return auth_schema_1.serviceStatusResponseSchema; } });
var pdf_schema_1 = require("./schemas/pdf.schema");
Object.defineProperty(exports, "pdfConvertRequestSchema", { enumerable: true, get: function () { return pdf_schema_1.pdfConvertRequestSchema; } });
Object.defineProperty(exports, "pdfConvertResponseSchema", { enumerable: true, get: function () { return pdf_schema_1.pdfConvertResponseSchema; } });
var image_schema_1 = require("./schemas/image.schema");
Object.defineProperty(exports, "imageConvertResponseSchema", { enumerable: true, get: function () { return image_schema_1.imageConvertResponseSchema; } });
Object.defineProperty(exports, "ImageFormat", { enumerable: true, get: function () { return image_schema_1.ImageFormat; } });
var qr_schema_1 = require("./schemas/qr.schema");
Object.defineProperty(exports, "qrGenerateRequestSchema", { enumerable: true, get: function () { return qr_schema_1.qrGenerateRequestSchema; } });
Object.defineProperty(exports, "qrGenerateResponseSchema", { enumerable: true, get: function () { return qr_schema_1.qrGenerateResponseSchema; } });
var error_schema_1 = require("./schemas/error.schema");
Object.defineProperty(exports, "errorResponseSchema", { enumerable: true, get: function () { return error_schema_1.errorResponseSchema; } });
// Create and export validators for each schema
exports.Validators = {
    Auth: {
        RegisterRequest: (0, validator_1.createValidator)(AuthSchemas.registerRequestSchema),
        LoginRequest: (0, validator_1.createValidator)(AuthSchemas.loginRequestSchema),
        ValidateTokenRequest: (0, validator_1.createValidator)(AuthSchemas.validateTokenRequestSchema),
        UserResponse: (0, validator_1.createValidator)(AuthSchemas.userResponseSchema),
        LoginResponse: (0, validator_1.createValidator)(AuthSchemas.loginResponseSchema),
        TokenValidationResponse: (0, validator_1.createValidator)(AuthSchemas.tokenValidationResponseSchema),
        ServiceStatusResponse: (0, validator_1.createValidator)(AuthSchemas.serviceStatusResponseSchema)
    },
    Pdf: {
        ConvertRequest: (0, validator_1.createValidator)(PdfSchemas.pdfConvertRequestSchema),
        ConvertResponse: (0, validator_1.createValidator)(PdfSchemas.pdfConvertResponseSchema)
    },
    Qr: {
        GenerateRequest: (0, validator_1.createValidator)(QrSchemas.qrGenerateRequestSchema),
        GenerateResponse: (0, validator_1.createValidator)(QrSchemas.qrGenerateResponseSchema)
    },
    Image: {
        ConvertResponse: (0, validator_1.createValidator)(ImageSchemas.imageConvertResponseSchema)
    },
    Error: {
        ErrorResponse: (0, validator_1.createValidator)(ErrorSchemas.errorResponseSchema)
    }
};
