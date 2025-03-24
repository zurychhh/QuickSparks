// Export generated TypeScript interfaces
export * from './generated/interfaces';

// Export validation utilities
export * from './validation/validator';

// Import schemas
import * as AuthSchemas from './schemas/auth.schema';
import * as PdfSchemas from './schemas/pdf.schema';
import * as ImageSchemas from './schemas/image.schema';
import * as QrSchemas from './schemas/qr.schema';
import * as ErrorSchemas from './schemas/error.schema';
import { createValidator } from './validation/validator';

// Export schemas explicitly to avoid naming conflicts
export {
  registerRequestSchema,
  loginRequestSchema,
  validateTokenRequestSchema,
  userResponseSchema,
  loginResponseSchema,
  tokenValidationResponseSchema,
  serviceStatusResponseSchema
} from './schemas/auth.schema';

export {
  pdfConvertRequestSchema,
  pdfConvertResponseSchema
} from './schemas/pdf.schema';

export {
  imageConvertResponseSchema,
  ImageFormat
} from './schemas/image.schema';

export {
  qrGenerateRequestSchema,
  qrGenerateResponseSchema
} from './schemas/qr.schema';

export {
  errorResponseSchema
} from './schemas/error.schema';

// Create and export validators for each schema
export const Validators = {
  Auth: {
    RegisterRequest: createValidator(AuthSchemas.registerRequestSchema),
    LoginRequest: createValidator(AuthSchemas.loginRequestSchema),
    ValidateTokenRequest: createValidator(AuthSchemas.validateTokenRequestSchema),
    UserResponse: createValidator(AuthSchemas.userResponseSchema),
    LoginResponse: createValidator(AuthSchemas.loginResponseSchema),
    TokenValidationResponse: createValidator(AuthSchemas.tokenValidationResponseSchema),
    ServiceStatusResponse: createValidator(AuthSchemas.serviceStatusResponseSchema)
  },
  Pdf: {
    ConvertRequest: createValidator(PdfSchemas.pdfConvertRequestSchema),
    ConvertResponse: createValidator(PdfSchemas.pdfConvertResponseSchema)
  },
  Qr: {
    GenerateRequest: createValidator(QrSchemas.qrGenerateRequestSchema),
    GenerateResponse: createValidator(QrSchemas.qrGenerateResponseSchema)
  },
  Image: {
    ConvertResponse: createValidator(ImageSchemas.imageConvertResponseSchema)
  },
  Error: {
    ErrorResponse: createValidator(ErrorSchemas.errorResponseSchema)
  }
};