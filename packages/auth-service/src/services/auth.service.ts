import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserResponseDto, LoginResponseDto } from '../dto/auth.dto';
import { TokenValidationResponse, Validators } from '@conversion-microservices/shared';

interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  // In a real application, this would be a database
  // For simplicity, we're using an in-memory store
  private users: User[] = [];

  // JWT settings (in a real app, these would be in environment variables)
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRATION = '1h';

  /**
   * Register a new user
   */
  async register(
    username: string,
    password: string,
    email: string,
  ): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = this.users.find(
      (user) => user.username === username || user.email === email,
    );
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser: User = {
      id: this.users.length + 1,
      username,
      password: hashedPassword,
      email,
      createdAt: new Date(),
    };

    this.users.push(newUser);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as UserResponseDto;
  }

  /**
   * Login a user
   */
  async login(
    username: string,
    password: string,
  ): Promise<LoginResponseDto | null> {
    // Find user
    const user = this.users.find((user) => user.username === username);
    if (!user) {
      return null;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRATION },
    );

    // Return user without password, but with token
    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      token,
    } as LoginResponseDto;
  }

  /**
   * Validate a token
   */
  async validate(token: string): Promise<TokenValidationResponse | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: number, username: string };
      
      // Validate the decoded token using our schema
      const validationResult = Validators.Auth.TokenValidationResponse({
        valid: true,
        user: {
          userId: decoded.userId,
          username: decoded.username
        }
      });

      if (validationResult.valid) {
        return validationResult.data as TokenValidationResponse;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}