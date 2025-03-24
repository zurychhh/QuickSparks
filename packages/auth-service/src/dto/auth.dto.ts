// Import interfaces from shared package
import {
  RegisterRequest,
  LoginRequest,
  ValidateTokenRequest,
  UserResponse,
  LoginResponse,
  TokenValidationResponse,
  ServiceStatusResponse
} from '@conversion-microservices/shared';

// Re-export the interfaces as DTOs
export class RegisterDto implements RegisterRequest {
  username!: string;
  password!: string;
  email!: string;
}

export class LoginDto implements LoginRequest {
  username!: string;
  password!: string;
}

export class ValidateTokenDto implements ValidateTokenRequest {
  token!: string;
}

export class UserResponseDto implements Omit<UserResponse, 'createdAt'> {
  id!: number;
  username!: string;
  email!: string;
  createdAt!: Date;
}

export class LoginResponseDto extends UserResponseDto implements Omit<LoginResponse, 'createdAt'> {
  token!: string;
}

export class TokenValidationResponseDto implements TokenValidationResponse {
  valid!: boolean;
  user!: {
    userId: number;
    username: string;
  };
}

export class ServiceStatusResponseDto implements ServiceStatusResponse {
  status!: 'online' | 'offline';
  service!: string;
}