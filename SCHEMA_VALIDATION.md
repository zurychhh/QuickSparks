# Schema Validation & TypeScript Integration

This document explains how schema validation and TypeScript type integration work in the conversion-microservices project.

## Overview

The project uses JSON Schema to validate all API request and response objects, with automatic generation of TypeScript interfaces from these schemas.

## Architecture

1. **JSON Schema Definitions**
   - Located in `/packages/shared/src/schemas/`
   - Define type information, constraints, and validation rules
   - Organized by service (auth.schema.ts, pdf.schema.ts, etc.)

2. **TypeScript Interface Generation**
   - Auto-generated from JSON Schema definitions
   - Generated files located in `/packages/shared/src/generated/`
   - Preserves comments, constraints, and type information from schemas

3. **Validation Utilities**
   - Located in `/packages/shared/src/validation/`
   - Uses Ajv (Another JSON Schema Validator) for runtime validation
   - Supports error reporting and type coercion

4. **Service Integration**
   - Each microservice imports schemas and types from shared package
   - NestJS validation pipes validate incoming requests
   - Type checking during development using TypeScript

## Workflow

1. **Define Schemas**: Create or update JSON schema definitions
2. **Generate Interfaces**: Run `pnpm run generate-schemas`
3. **Validate Schemas**: Run `pnpm run validate-schemas`
4. **Import in Services**: Use in controllers and services for validation

## Example: Request Validation

```typescript
// In controller
@Post('auth/register')
@UsePipes(RegisterValidationMiddleware)
async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
  // Request is already validated by middleware
  // ...
}
```

## Benefits

1. **Type Safety**: TypeScript provides compile-time type checking
2. **Runtime Validation**: JSON Schema validation ensures data correctness at runtime
3. **Single Source of Truth**: Schemas define both TypeScript types and validation rules
4. **Documentation**: Schemas serve as living documentation for API contracts
5. **Testing**: Easy to validate schemas and ensure compatibility

## Commands

```bash
# Generate TypeScript interfaces from JSON Schema
pnpm run generate-schemas

# Run tests for schema validators
pnpm run validate-schemas

# Build shared package (includes schema generation)
pnpm run --filter @conversion-microservices/shared build
```