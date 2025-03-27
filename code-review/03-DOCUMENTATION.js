/**
 * 03-DOCUMENTATION.js
 * 
 * This file contains key documentation from the PDFSpark project.
 */

// API Integration Implementation Plan
// ===============================
const apiBackendSolution = `
# API Backend Solution

## Integration between Frontend (Vercel) and Backend (Render.com)

### Problem Statement
We need to solve the integration between our frontend deployed on Vercel and our backend API deployed on Render.com. The main issues are:

1. CORS (Cross-Origin Resource Sharing) restrictions
2. Configuring the frontend to properly communicate with the backend
3. Setting up environment variables correctly

### Solution Approach

#### 1. Backend Configuration (Render.com)

1. Configure CORS in the Express backend:
   - Update CORS settings to allow requests from Vercel domains
   - Enable credentials if needed
   - Add proper headers for preflight requests

2. Set up environment variables on Render.com:
   - `FRONTEND_URL`: Set to your Vercel deployment URL
   - `NODE_ENV`: Set to 'production'
   - Other required variables (DB, storage, etc.)

#### 2. Frontend Configuration (Vercel)

1. Update API configuration to use relative paths in production:
   - Use '/api' as the base URL in production
   - Use absolute URLs for local development

2. Set up Vercel configuration (vercel.json):
   - Use rewrites to proxy API requests to the backend
   - Add proper headers for CORS

3. Set environment variables on Vercel:
   - `API_URL`: For local development only
   - `NODE_ENV`: Set to 'production'

### Implementation Details

#### Backend CORS Configuration

\`\`\`typescript
// In your Express app
import cors from 'cors';

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',  // Vite dev server
      'https://pdfspark.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
\`\`\`

#### Frontend API Configuration

\`\`\`typescript
// api.config.ts
const config = {
  // Use relative URL in production, absolute URL in development
  baseUrl: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001/api',
  
  // API endpoints
  endpoints: {
    // Your endpoints here
  }
};

export default config;
\`\`\`

#### Vercel.json Configuration

\`\`\`json
{
  "version": 2,
  "builds": [
    { "src": "packages/frontend/dist/**", "use": "@vercel/static" }
  ],
  "routes": [
    { 
      "src": "/api/(.*)", 
      "dest": "https://your-backend.onrender.com/api/$1",
      "headers": {
        "Access-Control-Allow-Origin": "https://your-frontend.vercel.app",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
        "Access-Control-Allow-Credentials": "true"
      }
    },
    { "src": "/(.*)", "dest": "/packages/frontend/dist/$1" }
  ]
}
\`\`\`

### Testing the Integration

1. Deploy both frontend and backend with updated configurations
2. Test API calls from the frontend to the backend
3. Check browser console for CORS errors
4. Verify that requests are properly proxied
5. Monitor API responses and error handling

### Troubleshooting

- CORS errors: Double-check allowed origins and header configuration
- 404 errors: Ensure proxy paths are correctly set up
- Authentication issues: Verify that cookies/tokens are properly handled with credentials settings
`;

// Backend Implementation Plan
// ========================
const backendImplementationPlan = `
# Backend Implementation Plan

## 1. Project Structure

\`\`\`
packages/conversion-service/
├── src/
│   ├── config/        - Configuration files
│   ├── controllers/   - Request handlers
│   ├── middleware/    - Express middleware
│   ├── models/        - Mongoose models
│   ├── routes/        - API routes
│   ├── services/      - Business logic
│   ├── types/         - TypeScript interfaces
│   ├── utils/         - Utility functions
│   └── index.ts       - Main entry point
\`\`\`

## 2. Core Features

### File Upload and Storage
- Implement secure file upload using multer
- Configure AWS S3 storage for persistent files
- Add validation for file types and sizes
- Generate secure links for file access

### PDF/DOCX Conversion
- PDF to DOCX conversion using pdf-lib and docx libraries
- DOCX to PDF conversion using libreoffice-convert
- Queue system for handling multiple conversion jobs
- Progress tracking and error handling

### Authentication
- JWT-based authentication
- User registration and login
- Role-based access control
- Secure password handling with bcrypt

### Payment Integration
- Stripe integration for premium features
- Subscription management
- Usage tracking and limitations
- Payment webhooks and notifications

## 3. API Endpoints

### Conversion Endpoints
- POST /api/conversion - Submit file for conversion
- GET /api/conversion/:id - Get conversion status
- DELETE /api/conversion/:id - Cancel conversion

### Download Endpoints
- GET /api/download/:fileId - Download converted file
- GET /api/thumbnails/:fileId - Get file thumbnail

### User Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user

### Payment Endpoints
- POST /api/payment/create-checkout - Create checkout session
- POST /api/payment/webhook - Handle Stripe webhook
- GET /api/payment/subscriptions - Get user subscriptions

## 4. Deployment Strategy

### Environment Setup
- Configure environment variables for production
- Set up MongoDB connection
- Configure AWS credentials
- Set up Stripe API keys

### Render.com Deployment
- Create web service on Render.com
- Configure build command: 'cd packages/conversion-service && npm install && npm run build'
- Configure start command: 'cd packages/conversion-service && npm start'
- Set environment variables in Render dashboard

### Monitoring and Logging
- Implement structured logging with Winston
- Set up error monitoring with Sentry
- Configure health check endpoint for uptime monitoring
`;

// Development Setup
// ==============
const setupDoc = `
# Development Setup

## Prerequisites

- Node.js v16+
- pnpm v8+
- MongoDB (local or Atlas)
- AWS account with S3 access
- Stripe account (for payment features)

## Installation

1. Clone the repository
   \`\`\`bash
   git clone https://github.com/your-org/pdfspark.git
   cd pdfspark
   \`\`\`

2. Install dependencies
   \`\`\`bash
   pnpm install
   \`\`\`

3. Set up environment variables
   \`\`\`bash
   # Create .env files in each package directory
   cp packages/conversion-service/.env.example packages/conversion-service/.env
   cp packages/frontend/.env.example packages/frontend/.env
   # Edit the .env files with your configuration
   \`\`\`

4. Start development servers
   \`\`\`bash
   # Start all services
   pnpm run dev
   # Or start individual services
   pnpm --filter "conversion-service" run dev
   pnpm --filter "frontend" run dev
   \`\`\`

## Testing

\`\`\`bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter "conversion-service" test
\`\`\`

## Building for Production

\`\`\`bash
# Build all packages
pnpm build

# Build a specific package
pnpm --filter "frontend" build
\`\`\`

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure the project settings:
   - Framework preset: Other
   - Build command: cd packages/frontend && pnpm install && pnpm build
   - Output directory: packages/frontend/dist
   - Install command: pnpm install
3. Add environment variables
4. Deploy

### Backend (Render.com)

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Configure the service:
   - Name: pdfspark-api
   - Environment: Node
   - Build command: cd packages/conversion-service && pnpm install && pnpm build
   - Start command: cd packages/conversion-service && node dist/index.js
4. Add environment variables
5. Deploy
`;