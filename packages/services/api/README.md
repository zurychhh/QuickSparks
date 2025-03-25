# PDFSpark API

This is the backend API service for PDFSpark, a document conversion service that transforms files between PDF and DOCX formats.

## Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Zod** - Schema validation
- **JWT** - Authentication
- **Multer** - File uploads
- **Compression** - Response compression
- **Helmet** - Security headers
- **Rate Limiting** - API request limiting

## Project Structure

```
src/
├── config/         # Configuration files
│   ├── database.ts # MongoDB connection
│   └── env.ts      # Environment variables
├── controllers/    # Route controllers
│   ├── auth.controller.ts
│   └── conversion.controller.ts
├── middleware/     # Express middleware
│   ├── auth.ts
│   ├── compression.ts
│   ├── rateLimit.ts
│   ├── security.ts
│   └── validation.ts
├── models/         # Mongoose models
│   ├── conversion.model.ts
│   ├── file.model.ts
│   └── user.model.ts
├── routes/         # API routes
│   ├── auth.routes.ts
│   ├── conversion.routes.ts
│   └── index.ts
├── schemas/        # Zod validation schemas
│   ├── conversion.schema.ts
│   └── user.schema.ts
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
│   ├── apiResponse.ts
│   └── errorHandler.ts
└── index.ts        # Application entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Update user password

### Conversion

- `POST /api/convert` - Start a new conversion
- `GET /api/convert/:id` - Check conversion status
- `GET /api/convert/history` - Get user's conversion history
- `GET /api/convert/download/:id` - Download converted file

## Setup and Running

1. Copy `.env.example` to `.env` and configure variables
2. Install dependencies: `npm install`
3. Development mode: `npm run dev`
4. Production build: `npm run build`
5. Start production server: `npm start`

## Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Run the built application
- `npm run dev` - Run in development mode with hot-reloading
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types

## Environment Variables

- `NODE_ENV` - Environment: development, production, test
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time
- `CORS_ORIGIN` - Allowed origins for CORS
- `UPLOAD_DIR` - Directory for file uploads
- `MAX_FILE_SIZE` - Maximum file size for uploads
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX` - Maximum requests per rate limit window