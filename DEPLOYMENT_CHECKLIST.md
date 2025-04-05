# PDFSpark Production Deployment Checklist

This checklist helps ensure that the application is properly configured and ready for production deployment on Vercel (frontend) and Render.com (backend).

## Frontend (Vercel) Pre-deployment Checks

### Environment Configuration
- [ ] Verify all environment variables are properly set
- [ ] Confirm frontend API endpoints use correct production URLs
- [ ] Check that logging and monitoring are configured

### Path Configuration
- [ ] Ensure Vite base path is set to `/` instead of relative paths
- [ ] Update all asset paths in index.html to use absolute paths (`/src/main.tsx` instead of `./src/main.tsx`)
- [ ] Verify that all internal links use correct absolute paths

### CORS and Security Headers
- [ ] Verify CORS settings match actual production domains
- [ ] Ensure Content Security Policy (CSP) is properly configured (but not too restrictive)
- [ ] Check that all required security headers are enabled:
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy

### API Connectivity
- [ ] Confirm API proxy settings are correct in vercel.json
- [ ] Verify all API endpoints are accessible through proxy
- [ ] Test authentication flows with production endpoints

### Build Configuration
- [ ] Check that build command in vercel.json is correct
- [ ] Verify output directory is properly configured
- [ ] Ensure all production optimizations are enabled

## Backend (Render.com) Pre-deployment Checks

### Microservices Configuration
- [ ] Verify all service dependencies are listed in their respective package.json files
- [ ] Check that Dockerfile and docker-compose.yml are properly configured
- [ ] Ensure all services have correct startup commands

### Environment Variables
- [ ] Set up all required environment variables in Render.com dashboard
- [ ] Verify secret keys and tokens are securely stored
- [ ] Check that service URLs are properly configured

### Health Checks
- [ ] Confirm all services have working /health endpoints
- [ ] Verify monitoring is set up for each service
- [ ] Test gateway health endpoint with ?detailed=true parameter

### Database and Storage
- [ ] Verify database connections with production credentials
- [ ] Confirm storage permissions are properly set
- [ ] Check backup procedures are in place

## Post-Deployment Verification

### Conversion Functionality Testing
- [ ] Test PDF to DOCX conversion with various files
- [ ] Test DOCX to PDF conversion with various files
- [ ] Verify file download functionality works correctly
- [ ] Test with files of different sizes (small, medium, large)

### API Endpoints
- [ ] Verify all API endpoints return correct responses
- [ ] Check authentication and authorization flows
- [ ] Test error handling with invalid requests

### Performance
- [ ] Verify page load times are acceptable
- [ ] Check API response times
- [ ] Ensure large file handling works correctly

### Security
- [ ] Verify Content Security Policy is not blocking legitimate resources
- [ ] Check CORS is properly configured
- [ ] Test upload file validation
- [ ] Verify URL validation works correctly

### Cross-Browser Testing
- [ ] Test in Chrome, Firefox, Safari, and Edge
- [ ] Verify mobile compatibility (iOS Safari, Android Chrome)
- [ ] Check responsive design at various screen sizes

## Monitoring and Logging Setup

- [ ] Set up error alerting
- [ ] Configure performance monitoring
- [ ] Set up uptime monitoring
- [ ] Verify remote logging is capturing relevant information

## Rollback Plan

1. Identify what version to roll back to (previous working deployment)
2. For Vercel, use the deployment history to revert to previous deployment
3. For Render.com, revert to previous commit in GitHub
4. Verify services after rollback
5. Communicate status to users

---

## Deployment Commands Reference

### Vercel Frontend Deployment
```bash
# Deploy to Vercel
vercel --prod

# Force rebuild without cache
vercel --prod -f
```

### Render.com Backend Deployment
```bash
# Render automatically deploys from GitHub
# For manual deployment, use the Render dashboard

# To check service status
curl -s https://pdfspark-api.onrender.com/health
```