# CI/CD Implementation for PDFSpark

This document outlines the CI/CD setup for the PDFSpark project.

## GitHub Actions Workflows

We have implemented the following GitHub Actions workflows:

### 1. CI Pipeline (ci.yml)

This workflow runs on all pushes to `main` and `develop` branches, as well as on all pull requests to these branches. It performs the following steps:

- **Lint**: Runs ESLint on all code to ensure code quality
- **TypeCheck**: Verifies TypeScript typing across the project
- **Test**: Executes all test suites
- **Build**: Builds all packages to verify build process

### 2. Frontend Deployment (deploy-frontend.yml)

This workflow automatically deploys the frontend to Vercel when changes are pushed to the `main` branch. It only triggers when changes are made to the frontend code or deployment workflow. It performs the following steps:

- Checks out the code
- Installs Vercel CLI
- Deploys the frontend to Vercel production environment

### 3. Backend API Deployment (deploy-api.yml)

This workflow automatically deploys the backend API when changes are pushed to the `main` branch. It only triggers when changes are made to the API code or deployment workflow. It performs the following steps:

- Checks out the code
- Sets up Node.js and pnpm
- Installs dependencies
- Builds the API
- Deploys to the hosting platform (placeholder for actual deployment)

### 4. Preview Environments (preview.yml)

This workflow creates preview environments for pull requests to `main` and `develop` branches. It performs the following steps:

- Checks out the code
- Installs Vercel CLI
- Deploys a preview version of the frontend
- Comments on the PR with the preview URL

## Error Monitoring Setup

We have integrated Sentry for error monitoring in both frontend and backend:

### Frontend Error Monitoring

- **Initialization**: Sentry is initialized in the main entry point of the app
- **Error Handling**: Global error boundaries capture and report unhandled errors
- **Custom Tracking**: Utility functions for manually capturing errors and messages

### Backend Error Monitoring

- **Initialization**: Sentry is initialized at the application startup
- **Middleware**: Sentry request and error handlers are added to the Express app
- **Unhandled Rejections**: Process-level unhandled rejections are captured
- **Custom Tracking**: Utility functions for manually capturing errors and messages

## Health Monitoring

We have implemented health checks for both frontend and backend:

- **Frontend Health**: Available at `/health` endpoint with system status information
- **API Health**: Available at `/api/health` endpoint with service status information, including database connection state

## Production Environments

### Frontend (Vercel)

- **Configuration**: A `vercel.json` file specifies build settings
- **Environment Variables**: Production environment variables are set in Vercel dashboard
- **Deployment**: Automatic deployments triggered by pushes to `main` branch

### Backend API

- **Environment Variables**: Production environment variables are defined in deployment platform
- **Database**: MongoDB Atlas connection for production environment
- **Deployment**: Automatic deployments triggered by pushes to `main` branch

## Required Secrets

The following secrets need to be configured in GitHub repository settings:

- `VERCEL_TOKEN`: API token for Vercel
- `VERCEL_ORG_ID`: Organization ID in Vercel
- `VERCEL_PROJECT_ID`: Project ID in Vercel
- `RAILWAY_TOKEN`: API token for Railway (if deploying backend to Railway)
- `SENTRY_DSN_FRONTEND`: Sentry DSN for frontend project
- `SENTRY_DSN_BACKEND`: Sentry DSN for backend project

## Future Improvements

1. Add performance monitoring with Sentry
2. Implement database migrations as part of the deployment process
3. Add end-to-end tests to the CI pipeline
4. Set up automated canary deployments
5. Implement infrastructure as code with Terraform or CDK