/**
 * 20-README_AND_INDEX.js
 * 
 * This file combines the README and INDEX information for the project.
 */

/**
 * =========================================================================
 * MARKDOWN README CONTENT - for viewing in code editors with markdown support
 * =========================================================================
 * 
 * # PDFSpark Code Review
 *
 * This directory contains a structured code review of the PDFSpark project, a microservices-based PDF and DOCX conversion service with a React frontend deployed on Vercel and a Node.js backend deployed on Render.com.
 *
 * ## Files Overview
 *
 * 1. [01-OVERVIEW.js](./01-OVERVIEW.js) - Project structure and architecture
 * 2. [02-CONFIG_FILES.js](./02-CONFIG_FILES.js) - Key configuration files
 * 3. [03-DOCUMENTATION.js](./03-DOCUMENTATION.js) - Project documentation
 * 4. [04-API_INTEGRATION.js](./04-API_INTEGRATION.js) - API integration implementation
 * 5. [05-FRONTEND_KOMPONENTY_LAYOUT.js](./05-FRONTEND_KOMPONENTY_LAYOUT.js) - Layout components
 * 6. [06-FRONTEND_STRONY.js](./06-FRONTEND_STRONY.js) - Page components
 * 7. [07-FRONTEND_KOMPONENTY_UI.js](./07-FRONTEND_KOMPONENTY_UI.js) - UI components
 * 8. [08-FRONTEND_HOOKS.js](./08-FRONTEND_HOOKS.js) - Custom React hooks
 * 9. [09-BACKEND_KONTROLERY.js](./09-BACKEND_KONTROLERY.js) - Backend controllers
 * 10. [10-BACKEND_KONWERSJA_KONTROLERY.js](./10-BACKEND_KONWERSJA_KONTROLERY.js) - Conversion controllers
 * 11. [11-BACKEND_KONWERSJA_SERWISY.js](./11-BACKEND_KONWERSJA_SERWISY.js) - Conversion services
 * 12. [12-BACKEND_MODELE.js](./12-BACKEND_MODELE.js) - Database models
 * 13. [13-BACKEND_MIDDLEWARE.js](./13-BACKEND_MIDDLEWARE.js) - Middleware components
 * 14. [14-BACKEND_UTILS.js](./14-BACKEND_UTILS.js) - Utility functions
 * 15. [15-TESTY.js](./15-TESTY.js) - Test examples
 * 16. [16-API_ROUTES.js](./16-API_ROUTES.js) - API route definitions
 * 17. [17-SHARED_COMMON.js](./17-SHARED_COMMON.js) - Shared types and utilities
 * 18. [18-DEPLOYMENT.js](./18-DEPLOYMENT.js) - Deployment configuration
 * 19. [19-SECURITY.js](./19-SECURITY.js) - Security implementations
 * 20. [20-README_AND_INDEX.js](./20-README_AND_INDEX.js) - Project documentation and index
 */

/**
 * INDEX CONTENT
 * 
 * This section provides an index of all the code review files.
 * 
 * The PDFSpark project is a microservices-based PDF and DOCX conversion service
 * with a React frontend deployed on Vercel and a Node.js backend deployed on Render.com.
 */

/**
 * Code Review Files Index:
 * 
 * 01-OVERVIEW.js - Project overview, architecture, and structure
 * 02-CONFIG_FILES.js - Key configuration files including Vercel, API, and environment
 * 03-DOCUMENTATION.js - Project documentation including API integration and backend impl plan
 * 04-API_INTEGRATION.js - API integration implementation between frontend and backend
 * 05-FRONTEND_KOMPONENTY_LAYOUT.js - Frontend layout components (Layout, Navbar, Footer)
 * 06-FRONTEND_STRONY.js - Frontend page components (Conversion page)
 * 07-FRONTEND_KOMPONENTY_UI.js - Frontend UI components (FileUpload, ConversionOptions, etc.)
 * 08-FRONTEND_HOOKS.js - Frontend custom React hooks (auth, analytics, etc.)
 * 09-BACKEND_KONTROLERY.js - Backend controllers for API endpoints
 * 10-BACKEND_KONWERSJA_KONTROLERY.js - Backend conversion controllers and routes
 * 11-BACKEND_KONWERSJA_SERWISY.js - Backend services for document conversions
 * 12-BACKEND_MODELE.js - Backend data models (MongoDB schemas)
 * 13-BACKEND_MIDDLEWARE.js - Backend middleware components (auth, file upload, etc.)
 * 14-BACKEND_UTILS.js - Backend utility functions (secure links, file storage, etc.)
 * 15-TESTY.js - Test examples for frontend and backend
 * 16-API_ROUTES.js - API route definitions for the backend
 * 17-SHARED_COMMON.js - Shared types, interfaces, and utility functions
 * 18-DEPLOYMENT.js - Deployment configuration (Vercel, Render, Docker)
 * 19-SECURITY.js - Security implementations and best practices
 * 20-README_AND_INDEX.js - Documentation summaries and file index for the project
 */

/**
 * TECHNOLOGY STACK:
 * 
 * Frontend:
 *   - React 18+
 *   - TypeScript
 *   - Vite for builds
 *   - TailwindCSS for styling
 *   - React Router for routing
 *   - Axios for API requests
 *   - Socket.io client for WebSockets
 * 
 * Backend:
 *   - Node.js with Express
 *   - TypeScript
 *   - MongoDB with Mongoose
 *   - JWT for authentication
 *   - Socket.io for WebSockets
 *   - pdf-lib and libreoffice-convert for document conversion
 *   - AWS S3 for file storage
 * 
 * Deployment:
 *   - Frontend: Vercel
 *   - Backend: Render.com
 *   - Database: MongoDB Atlas
 *   - File Storage: AWS S3
 *   - CI/CD: GitHub Actions
 */

/**
 * KEY INTEGRATION POINTS:
 * 
 * 1. Frontend to Backend API Integration:
 *    - Frontend uses relative path '/api' in production that is proxied by Vercel
 *    - Vercel configuration forwards API requests to the Render.com backend
 *    - CORS is properly configured on the backend to allow requests from the frontend
 * 
 * 2. WebSocket Integration:
 *    - Real-time conversion progress updates via WebSockets
 *    - Socket.io is used on both frontend and backend
 * 
 * 3. File Processing Flow:
 *    - Upload file via frontend or API
 *    - Backend validates and processes the file
 *    - Conversion status updates are sent via WebSocket
 *    - Secure download links are generated for the converted files
 * 
 * 4. Authentication:
 *    - JWT-based authentication across services
 *    - Tokens are stored in localStorage on the frontend
 *    - Authentication middleware on the backend validates tokens
 * 
 * 5. Payment Integration:
 *    - Stripe integration for premium features
 *    - Secure webhooks for payment notifications
 */

/**
 * API ENDPOINTS OVERVIEW:
 * 
 * Conversion Endpoints:
 *   - POST /api/conversion - Submit file for conversion
 *   - GET /api/conversion/:id - Get conversion status
 *   - DELETE /api/conversion/:id - Cancel conversion
 * 
 * Download Endpoints:
 *   - GET /api/download/:token - Download converted file
 *   - GET /api/download/status/:token - Check download availability
 *   - GET /api/download/thumbnail/:id - Get file thumbnail
 * 
 * Payment Endpoints:
 *   - POST /api/payment/create-checkout - Create checkout session
 *   - POST /api/payment/webhook - Handle Stripe webhook
 *   - GET /api/payment/verify/:conversionId - Verify payment status
 * 
 * Health Check:
 *   - GET /api/health - API health check
 */

/**
 * SECURITY MEASURES:
 * 
 * - HTTPS for all communications
 * - JWT with appropriate expiration times
 * - CORS restrictions
 * - Input validation and sanitization
 * - Secure file handling
 * - Rate limiting
 * - Content Security Policy
 * - Secure HTTP headers
 */

/**
 * DEPLOYMENT STRATEGY:
 * 
 * - Frontend deployed on Vercel
 * - Backend deployed on Render.com
 * - MongoDB deployed on Atlas
 * - Files stored in AWS S3
 * - CI/CD using GitHub Actions
 * - Docker containers for local development
 */

/**
 * README CONTENT
 * 
 * This section contains documentation summaries for the project.
 */

// Main README
// ========
const mainReadme = `
# PDFSpark

<p align="center">
  <img src="https://your-domain.com/logo.svg" alt="PDFSpark Logo" width="200" />
</p>

> Fast, reliable PDF and DOCX conversion service with API and web interface.

## Features

- 📄 Convert PDF to DOCX and DOCX to PDF with high fidelity
- 🔄 Maintain formatting, images, tables, and styles during conversion
- 🔒 Secure file handling with encrypted storage and secure download links
- 🚀 Real-time conversion status updates via WebSockets
- 💳 Freemium model with paid options for larger files and premium features
- 👤 User accounts for tracking conversion history
- 🌐 Modern, responsive web interface

## Architecture

PDFSpark uses a microservices architecture:

- **Frontend**: React/TypeScript application deployed on Vercel
- **Backend**: Express/TypeScript API service deployed on Render.com
- **Storage**: AWS S3 for secure file storage
- **Database**: MongoDB for metadata and user information
- **Authentication**: JWT-based auth system
- **Payments**: Stripe integration for premium features

## Getting Started

### Prerequisites

- Node.js v16+
- pnpm v8+
- MongoDB (local or Atlas)
- AWS S3 bucket
- Stripe account (for payment features)

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/your-org/pdfspark.git
   cd pdfspark
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   # Create .env files in each package directory
   cp packages/conversion-service/.env.example packages/conversion-service/.env
   cp packages/frontend/.env.example packages/frontend/.env
   # Edit the .env files with your configuration
   \`\`\`

4. Start development servers:
   \`\`\`bash
   # Start all services
   pnpm run dev
   \`\`\`

### Usage

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Documentation

The API documentation is available at [/api/docs](http://localhost:3001/api/docs) when running the development server.

### Key Endpoints

- \`POST /api/conversion\`: Upload and start a conversion job
- \`GET /api/conversion/:id\`: Get conversion status
- \`GET /api/download/:token\`: Download converted file
- \`POST /api/payment/create-checkout\`: Create payment session for premium downloads

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
`;

// API Integration Documentation
// =========================
const apiIntegrationDoc = `
# API Integration Guide

This document explains how to integrate with the PDFSpark API.

## Authentication

The API uses JWT (JSON Web Token) for authentication. To obtain a token:

\`\`\`bash
curl -X POST https://api.pdfspark.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "your-email@example.com", "password": "your-password"}'
\`\`\`

The response will include a token:

\`\`\`json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "your-email@example.com",
    "name": "Your Name"
  }
}
\`\`\`

Include this token in subsequent requests:

\`\`\`bash
curl -X GET https://api.pdfspark.com/api/conversion \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
\`\`\`

## Converting a Document

### 1. Upload the document

\`\`\`bash
curl -X POST https://api.pdfspark.com/api/conversion \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@/path/to/document.pdf" \\
  -F "conversionType=pdf-to-docx" \\
  -F "quality=high"
\`\`\`

Response:

\`\`\`json
{
  "message": "Conversion job created successfully",
  "conversionId": "conv_12345"
}
\`\`\`

### 2. Check conversion status

\`\`\`bash
curl -X GET https://api.pdfspark.com/api/conversion/conv_12345 \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

Response:

\`\`\`json
{
  "id": "conv_12345",
  "fileName": "document.pdf",
  "status": "processing",
  "progress": 45,
  "createdAt": "2023-07-01T12:34:56Z"
}
\`\`\`

### 3. Download converted file

Once the status is "completed", the response will include a download URL:

\`\`\`json
{
  "id": "conv_12345",
  "fileName": "document.pdf",
  "status": "completed",
  "progress": 100,
  "createdAt": "2023-07-01T12:34:56Z",
  "completedAt": "2023-07-01T12:35:26Z",
  "downloadUrl": "/api/download/secure_token_here"
}
\`\`\`

Download the file:

\`\`\`bash
curl -X GET https://api.pdfspark.com/api/download/secure_token_here \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -o converted_document.docx
\`\`\`

## Real-time Updates via WebSocket

For real-time conversion progress updates, connect to the WebSocket:

\`\`\`javascript
const socket = io('https://api.pdfspark.com', {
  transports: ['websocket'],
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Join conversion room
socket.emit('join-conversion', { conversionId: 'conv_12345' });

// Listen for conversion updates
socket.on('conversion-status-conv_12345', (data) => {
  console.log('Conversion progress:', data.progress);
  
  if (data.status === 'completed') {
    console.log('Conversion complete:', data.fileUrl);
  }
});

// Leave conversion room when done
socket.emit('leave-conversion', { conversionId: 'conv_12345' });
\`\`\`

## Error Handling

API errors follow this format:

\`\`\`json
{
  "error": true,
  "message": "Error message description",
  "details": {
    "field": "Specific field error"
  }
}
\`\`\`

Common HTTP status codes:
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid or missing token)
- 404: Not Found (resource doesn't exist)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error
`;

// Frontend Development Guide
// =====================
const frontendDevGuide = `
# Frontend Development Guide

## Overview

The PDFSpark frontend is built with:

- React 18+
- TypeScript
- Vite for builds
- TailwindCSS for styling
- React Router for routing
- Axios for API communication
- Socket.io for WebSockets
- Jest and React Testing Library for testing

## Project Structure

\`\`\`
packages/frontend/
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   │   ├── layout/    # Layout components
│   │   └── ui/        # UI components
│   ├── config/        # Configuration files
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── store/         # State management
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main App component
│   └── main.tsx       # Entry point
├── tests/             # Test files
├── vite.config.ts     # Vite configuration
└── tsconfig.json      # TypeScript configuration
\`\`\`

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

3. Build for production:
   \`\`\`bash
   pnpm build
   \`\`\`

4. Run tests:
   \`\`\`bash
   pnpm test
   \`\`\`
`;

// Backend Development Guide
// ====================
const backendDevGuide = `
# Backend Development Guide

## Overview

The PDFSpark backend is built with:

- Node.js
- Express.js
- TypeScript
- MongoDB (Mongoose)
- AWS SDK for S3 integration
- Socket.io for WebSockets
- JWT for authentication
- Zod for validation
- Jest for testing

## Project Structure

\`\`\`
packages/conversion-service/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Express middleware
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── types/         # TypeScript interfaces
│   ├── utils/         # Utility functions
│   └── index.ts       # Entry point
├── tests/             # Test files
└── tsconfig.json      # TypeScript configuration
\`\`\`

## Getting Started

1. Install dependencies:
   \`\`\`bash
   pnpm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

3. Run tests:
   \`\`\`bash
   pnpm test
   \`\`\`
`;

// Code documentation
// =============
const codeDoc = `
# PDFSpark Code Documentation

## Main Components

### File Conversion Flow

1. User uploads a file via frontend or API
2. Backend validates file type and size
3. Conversion job is created and stored in database
4. File is processed asynchronously
5. WebSocket notifications are sent for progress updates
6. Converted file is stored securely
7. Secure download link is generated
8. User can download the converted file

### Authentication Flow

1. User registers or logs in
2. Backend validates credentials
3. JWT token is generated and returned
4. Frontend stores token in localStorage
5. Token is included in API requests
6. Backend validates token for protected routes

## Key Files

### Frontend

- \`src/App.tsx\`: Main application component
- \`src/components/ui/FileUpload.tsx\`: File upload component
- \`src/pages/Conversion.tsx\`: Conversion page with main user flow
- \`src/services/api.ts\`: API service for backend communication
- \`src/hooks/useAuth.ts\`: Authentication hook

### Backend

- \`src/index.ts\`: Entry point and server setup
- \`src/controllers/conversionController.ts\`: Handles conversion requests
- \`src/services/pdfToDocxService.ts\`: PDF to DOCX conversion logic
- \`src/services/docxToPdfService.ts\`: DOCX to PDF conversion logic
- \`src/middleware/auth.ts\`: Authentication middleware
`;

// Export all documentation for the README file
const allDocs = {
  mainReadme,
  apiIntegrationDoc,
  frontendDevGuide,
  backendDevGuide,
  codeDoc
};