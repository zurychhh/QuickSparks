import { Controller, Post, Body, Get, HttpException, HttpStatus, UsePipes, UseInterceptors } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  ValidateTokenDto, 
  ServiceStatusResponseDto, 
  UserResponseDto,
  LoginResponseDto,
  TokenValidationResponseDto
} from '../dto/auth.dto';
import { 
  RegisterValidationMiddleware, 
  LoginValidationMiddleware, 
  ValidateTokenValidationMiddleware 
} from '../middleware/validation.middleware';
import { Validators } from '@conversion-microservices/shared';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  getStatus(): ServiceStatusResponseDto {
    return { status: 'online', service: 'auth-service' };
  }

  @Post('auth/register')
  @UsePipes(RegisterValidationMiddleware)
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    try {
      return await this.authService.register(
        registerDto.username,
        registerDto.password,
        registerDto.email,
      );
    } catch (error) {
      if (error.message === 'User already exists') {
        throw new HttpException(
          { error: error.message },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        { error: 'Registration failed' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auth/login')
  @UsePipes(LoginValidationMiddleware)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );

    if (!user) {
      throw new HttpException(
        { error: 'Invalid credentials' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }

  @Post('auth/validate')
  @UsePipes(ValidateTokenValidationMiddleware)
  async validate(@Body() validateTokenDto: ValidateTokenDto): Promise<TokenValidationResponseDto> {
    const result = await this.authService.validate(validateTokenDto.token);

    if (!result) {
      throw new HttpException(
        { error: 'Invalid token' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return result;
  }
}