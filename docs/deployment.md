# Deployment Guide for PDFSpark

This document outlines the deployment process for the PDFSpark application.

## Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB Atlas account
- Vercel account
- Sentry account
- GitHub account

## Environment Setup

### Frontend (.env)

Create a `.env` file in the `packages/frontend` directory with the following variables:

```
VITE_API_URL=https://api.pdfspark.com/api
VITE_ENVIRONMENT=production
VITE_SENTRY_DSN=your_sentry_dsn
VITE_APP_VERSION=0.1.0
```

### Backend API (.env)

Create a `.env` file in the `packages/services/api` directory with the following variables:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pdfspark
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
SENTRY_DSN=your_sentry_dsn
```

## CI/CD Setup

### GitHub Actions

The repository is configured with GitHub Actions workflows for:

1. **CI Pipeline**: Runs linting, type checking, and tests for all pull requests and pushes to main branch
2. **Frontend Deployment**: Automatically deploys frontend to Vercel on pushes to main branch
3. **API Deployment**: Automatically deploys API to server (placeholder - needs configuration)
4. **Preview Environments**: Creates preview deployments for pull requests

### Vercel Configuration

1. Create a new project in Vercel
2. Connect it to your GitHub repository
3. Set up the following environment variables:
   - `VITE_API_URL`: URL to your API
   - `VITE_ENVIRONMENT`: production
   - `VITE_SENTRY_DSN`: Your Sentry DSN
   - `VITE_APP_VERSION`: Current version

4. Set the following build settings:
   - Framework Preset: Vite
   - Root Directory: packages/frontend
   - Build Command: pnpm build
   - Output Directory: dist

### GitHub Secrets

Add the following secrets to your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `RAILWAY_TOKEN`: Your Railway API token (if deploying backend to Railway)

## Manual Deployment

### Frontend

```bash
cd packages/frontend
pnpm build
# Deploy the dist directory to your hosting service
```

### Backend API

```bash
cd packages/services/api
pnpm build
# Deploy the dist directory to your server
```

## MongoDB Atlas Setup

1. Create a cluster in MongoDB Atlas
2. Create a database user with appropriate permissions
3. Whitelist IP addresses or use network access rules
4. Get the connection string and update the `MONGODB_URI` in your environment variables

## Sentry Setup

1. Create a project in Sentry for both frontend and backend
2. Get the DSN for each project
3. Set up the DSN in the environment variables
4. Configure alert rules in Sentry dashboard

## Health Monitoring

The application uses Sentry for error tracking and performance monitoring.

### Uptime Monitoring

Set up a monitoring service like Uptime Robot or Pingdom to check the health endpoints:

- Frontend: https://pdfspark.com/health
- API: https://api.pdfspark.com/api/health

## Troubleshooting

If you encounter issues during deployment:

1. Check the CI/CD logs in GitHub Actions
2. Verify environment variables are set correctly
3. Check Sentry for captured errors
4. Validate MongoDB connection
5. Check application logs on the server

For more help, contact the development team.