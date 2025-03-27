/**
 * 18-DEPLOYMENT.js
 * 
 * This file contains deployment configuration for the project.
 */

// Vercel.json Deployment Configuration
// ===============================
// vercel.json
const vercelConfig = `
{
  "version": 2,
  "builds": [
    { 
      "src": "packages/frontend/dist/**", 
      "use": "@vercel/static" 
    }
  ],
  "routes": [
    { 
      "src": "/api/(.*)", 
      "dest": "https://pdfspark-api.onrender.com/api/$1",
      "headers": {
        "Access-Control-Allow-Origin": "https://pdfspark.vercel.app",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
        "Access-Control-Allow-Credentials": "true"
      }
    },
    { 
      "src": "/(.*)", 
      "dest": "/packages/frontend/dist/$1" 
    }
  ]
}
`;

// Render.com Service Configuration
// ===========================
// render.yaml
const renderConfig = `
services:
  # Backend API service
  - type: web
    name: pdfspark-api
    env: node
    region: oregon
    plan: starter
    buildCommand: cd packages/conversion-service && npm install && npm run build
    startCommand: cd packages/conversion-service && node dist/index.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: AWS_BUCKET_NAME
        sync: false
      - key: AWS_REGION
        value: us-west-2
      - key: AWS_ACCESS_KEY_ID
        sync: false
      - key: AWS_SECRET_ACCESS_KEY
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
      - key: FRONTEND_URL
        value: https://pdfspark.vercel.app
    autoDeploy: true
`;

// GitHub Actions CI/CD Workflow
// =========================
// .github/workflows/ci.yml
const cicdConfig = `
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run tests
        run: npm test

  build:
    name: Build
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build frontend
        run: npm run build -w packages/frontend
        
      - name: Build backend
        run: npm run build -w packages/conversion-service
        
      - name: Upload frontend build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: packages/frontend/dist
          
      - name: Upload backend build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: backend-build
          path: packages/conversion-service/dist

  deploy-staging:
    name: Deploy to Staging
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Download frontend build
        uses: actions/download-artifact@v3
        with:
          name: frontend-build
          path: packages/frontend/dist
          
      - name: Download backend build
        uses: actions/download-artifact@v3
        with:
          name: backend-build
          path: packages/conversion-service/dist
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
          
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-production:
    name: Deploy to Production
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Download frontend build
        uses: actions/download-artifact@v3
        with:
          name: frontend-build
          path: packages/frontend/dist
          
      - name: Download backend build
        uses: actions/download-artifact@v3
        with:
          name: backend-build
          path: packages/conversion-service/dist
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
          
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_PRODUCTION }}
`;

// Docker Compose Configuration
// ========================
// docker-compose.yml
const dockerComposeConfig = `
version: '3.8'

services:
  # Frontend service
  frontend:
    build:
      context: .
      dockerfile: packages/frontend/Dockerfile
    ports:
      - "5173:80"
    environment:
      - VITE_API_URL=http://api:3001/api
    depends_on:
      - api
    networks:
      - pdfspark-network

  # Backend API service
  api:
    build:
      context: .
      dockerfile: packages/conversion-service/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - MONGODB_URI=mongodb://mongo:27017/pdfspark
      - JWT_SECRET=development_secret_key
      - FRONTEND_URL=http://localhost:5173
    depends_on:
      - mongo
    networks:
      - pdfspark-network
    volumes:
      - ./uploads:/app/uploads

  # MongoDB service
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - pdfspark-network

networks:
  pdfspark-network:
    driver: bridge

volumes:
  mongo-data:
`;

// Frontend Dockerfile
// ===============
// packages/frontend/Dockerfile
const frontendDockerfile = `
# Build stage
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json ./
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/frontend ./packages/frontend/

# Build the app
RUN npm run build -w packages/frontend

# Production stage
FROM nginx:alpine

# Copy build files from build stage
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
`;

// Backend Dockerfile
// =============
// packages/conversion-service/Dockerfile
const backendDockerfile = `
# Base stage
FROM node:16-alpine as base

# Install system dependencies
RUN apk add --no-cache libreoffice-writer poppler-utils

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json ./
COPY packages/conversion-service/package.json ./packages/conversion-service/

# Install dependencies
RUN npm ci

# Build stage
FROM base as build

# Copy source code
COPY packages/conversion-service ./packages/conversion-service/

# Build the app
RUN npm run build -w packages/conversion-service

# Production stage
FROM base

# Copy build files from build stage
COPY --from=build /app/packages/conversion-service/dist ./packages/conversion-service/dist

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3001

# Start the app
CMD ["node", "packages/conversion-service/dist/index.js"]
`;

// Nginx Configuration for Frontend
// ===========================
// packages/frontend/nginx.conf
const nginxConfig = `
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
        application/javascript
        application/json
        application/xml
        text/css
        text/plain
        text/xml;
    
    # Handle React routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \\.(?:jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|css|js)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
`;