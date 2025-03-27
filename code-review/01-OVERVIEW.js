/**
 * 01-OVERVIEW.js
 * 
 * This file provides an overview of the PDFSpark project structure and architecture.
 */

// Project Structure
// ----------------
// /packages/
//   /auth-service/ - Authentication microservice
//   /conversion-service/ - Core PDF/DOCX conversion functionality
//   /frontend/ - React-based user interface
//   /shared/ - Shared types, schemas, and utilities
// /gateway/ - API gateway for routing requests
// /docs/ - Project documentation

// Architecture Overview
// -------------------
// PDFSpark uses a microservices architecture with the following components:
// 1. Frontend (React/TypeScript) - Deployed on Vercel
// 2. Backend Services:
//    - Conversion Service (Express/TypeScript) - Deployed on Render.com
//    - Auth Service (NestJS/TypeScript) - Deployed on Render.com
// 3. API Gateway (Express) - Routes requests to appropriate services

// Deployment Strategy
// -----------------
// - Frontend: Vercel (with API proxy configuration)
// - Backend: Render.com (with environment variables for service coordination)
// - Database: MongoDB Atlas
// - File Storage: AWS S3

// Key Integration Points
// --------------------
// - Frontend communicates with backend via relative '/api' path in production
// - Vercel configuration proxies API requests to backend services
// - CORS configured to allow secure cross-origin requests
// - JWT used for authentication across services
// - WebSockets for real-time conversion status updates

// Core Functionality
// ----------------
// 1. File Upload: Secure multi-part file upload with progress tracking
// 2. Conversion: PDF to DOCX and DOCX to PDF conversion with various options
// 3. Downloads: Secure download links with optional payment requirements
// 4. Authentication: User registration, login, and profile management
// 5. Payments: Integration with Stripe for premium features