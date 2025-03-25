# Backend Implementation Plan (Task 7)

## Overview
The backend implementation will consist of an Express.js API with TypeScript, connected to a MongoDB database, and featuring comprehensive security middleware and data validation.

## Directory Structure
```
packages/services/
└── api/
    ├── src/
    │   ├── config/       # Configuration files (database, environment)
    │   ├── controllers/  # Route controllers
    │   ├── middleware/   # Express middleware
    │   ├── models/       # Mongoose models
    │   ├── routes/       # API routes
    │   ├── services/     # Business logic
    │   ├── types/        # TypeScript type definitions
    │   ├── utils/        # Utility functions
    │   └── index.ts      # Main application entry point
    ├── tests/            # Test files
    ├── .env.example      # Example environment variables
    ├── package.json      # Dependencies and scripts
    └── tsconfig.json     # TypeScript configuration
```

## Task 7 Implementation Steps

### 7.1. Create Express.js Project
- Initialize package with TypeScript
- Set up Express server with basic configuration
- Configure environment variables
- Implement basic error handling

**Files to Create:**
- `packages/services/api/package.json`
- `packages/services/api/tsconfig.json`
- `packages/services/api/src/index.ts`
- `packages/services/api/src/config/env.ts`
- `packages/services/api/src/utils/errorHandler.ts`

### 7.2. Implement Basic API Structure
- Create route structure
- Implement controllers
- Set up basic services layer
- Define API response formats

**Files to Create:**
- `packages/services/api/src/routes/index.ts`
- `packages/services/api/src/routes/conversion.routes.ts`
- `packages/services/api/src/routes/auth.routes.ts`
- `packages/services/api/src/controllers/conversion.controller.ts`
- `packages/services/api/src/controllers/auth.controller.ts`
- `packages/services/api/src/services/conversion.service.ts`
- `packages/services/api/src/utils/apiResponse.ts`

### 7.3. Add Security Middleware
- Implement CORS configuration
- Add Helmet for security headers
- Set up rate limiting
- Implement request validation middleware
- Configure compression middleware

**Files to Create:**
- `packages/services/api/src/middleware/security.ts`
- `packages/services/api/src/middleware/rateLimit.ts`
- `packages/services/api/src/middleware/validation.ts`
- `packages/services/api/src/middleware/compression.ts`

### 7.4. Configure MongoDB Connection
- Set up Mongoose connection
- Implement connection pooling
- Add database error handling
- Configure database models

**Files to Create:**
- `packages/services/api/src/config/database.ts`
- `packages/services/api/src/models/user.model.ts`
- `packages/services/api/src/models/conversion.model.ts`
- `packages/services/api/src/models/file.model.ts`

### 7.5. Prepare Data Validation System
- Implement Zod schemas
- Create validation middleware
- Set up request schema validation
- Add response validation

**Files to Create:**
- `packages/services/api/src/schemas/user.schema.ts`
- `packages/services/api/src/schemas/conversion.schema.ts`
- `packages/services/api/src/schemas/file.schema.ts`
- `packages/services/api/src/middleware/validateRequest.ts`

## API Endpoints to Implement

### Authentication Endpoints
```
POST /api/auth/register - Register a new user
POST /api/auth/login - Login and receive JWT token
POST /api/auth/logout - Logout and invalidate token
GET /api/auth/me - Get current user info
```

### Conversion Endpoints
```
POST /api/convert/pdf-to-docx - Convert PDF to DOCX
POST /api/convert/docx-to-pdf - Convert DOCX to PDF
GET /api/convert/status/:id - Check conversion status
GET /api/convert/download/:id - Download converted file
GET /api/convert/history - Get user's conversion history
```

## Database Models

### User Model
```typescript
interface User {
  _id: ObjectId;
  email: string;
  password: string;
  name: string;
  plan: 'free' | 'standard' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}
```

### Conversion Model
```typescript
interface Conversion {
  _id: ObjectId;
  userId: ObjectId;
  sourceFileId: ObjectId;
  resultFileId: ObjectId | null;
  conversionType: 'pdf-to-docx' | 'docx-to-pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  error: string | null;
}
```

### File Model
```typescript
interface File {
  _id: ObjectId;
  userId: ObjectId;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
  expiresAt: Date;
}
```

## Middleware Functions to Implement

### Security Middleware
- `corsMiddleware`: Configure CORS settings
- `helmetMiddleware`: Set security headers
- `rateLimitMiddleware`: Limit request rates
- `compressionMiddleware`: Compress responses

### Authentication Middleware
- `authMiddleware`: Verify JWT and attach user to request
- `roleMiddleware`: Check user roles for authorization

### Validation Middleware
- `validateRequestMiddleware`: Validate request data with Zod

### Error Handling Middleware
- `errorHandlerMiddleware`: Catch and format errors

## Development Considerations

### Environment Variables
- `NODE_ENV`: Environment (development, test, production)
- `PORT`: API server port
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT tokens
- `JWT_EXPIRES_IN`: JWT expiration time
- `CORS_ORIGIN`: Allowed origins for CORS

### Testing Strategy
- Unit tests for services and utilities
- Integration tests for API endpoints
- Database model tests

### Logging Strategy
- Request logging with morgan
- Application logging with winston
- Error logging with stack traces in development

## Deployment Strategy
- Containerize with Docker
- Deploy API to Vercel Serverless
- Set up MongoDB Atlas as the database

---

This plan will be implemented as part of Task 7 in the PDFSPARK_TASKLIST.md file. The backend will be designed to support the frontend implemented in Task 6.