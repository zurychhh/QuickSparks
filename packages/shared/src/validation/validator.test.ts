import { validate } from './validator';
import {
  registerRequestSchema,
  loginRequestSchema,
  pdfConvertRequestSchema,
  qrGenerateRequestSchema
} from '../index';

describe('Validator', () => {
  describe('RegisterRequest', () => {
    it('should validate valid registration data', () => {
      const data = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com'
      };
      
      const result = validate(registerRequestSchema, data);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });
    
    it('should reject invalid registration data', () => {
      const data = {
        username: 'te', // too short
        password: 'pass', // too short
        email: 'not-an-email'
      };
      
      const result = validate(registerRequestSchema, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
    
    it('should reject missing required fields', () => {
      const data = {
        username: 'testuser',
        // password missing
        email: 'test@example.com'
      };
      
      const result = validate(registerRequestSchema, data);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('password');
    });
  });
  
  describe('LoginRequest', () => {
    it('should validate valid login data', () => {
      const data = {
        username: 'testuser',
        password: 'password123'
      };
      
      const result = validate(loginRequestSchema, data);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });
    
    it('should reject missing required fields', () => {
      const data = {
        username: 'testuser'
        // password missing
      };
      
      const result = validate(loginRequestSchema, data);
      expect(result.valid).toBe(false);
    });
  });
  
  describe('PdfConvertRequest', () => {
    it('should validate valid PDF convert request', () => {
      const data = {
        text: 'Sample text to convert to PDF'
      };
      
      const result = validate(pdfConvertRequestSchema, data);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });
    
    it('should reject empty text', () => {
      const data = {
        text: ''
      };
      
      const result = validate(pdfConvertRequestSchema, data);
      expect(result.valid).toBe(false);
    });
  });
  
  describe('QrGenerateRequest', () => {
    it('should validate valid QR generate request with minimal data', () => {
      const data = {
        text: 'https://example.com'
      };
      
      const result = validate(qrGenerateRequestSchema, data);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });
    
    it('should validate valid QR generate request with all options', () => {
      const data = {
        text: 'https://example.com',
        size: 300,
        dark: '#000000',
        light: '#FFFFFF'
      };
      
      const result = validate(qrGenerateRequestSchema, data);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
    });
    
    it('should reject invalid size', () => {
      const data = {
        text: 'https://example.com',
        size: 'large' // should be a number
      };
      
      const result = validate(qrGenerateRequestSchema, data as any);
      expect(result.valid).toBe(false);
    });
  });
});