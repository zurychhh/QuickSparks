# PDFSpark Admin Guide

This document provides instructions for system administrators on managing and maintaining the PDFSpark application at quicksparks.dev/pdfspark.

## Deployment Architecture

PDFSpark is deployed as a subdirectory application on the main quicksparks.dev domain. This setup allows multiple applications to coexist under the same domain.

Key points:
- Frontend: React SPA running at `/pdfspark/`
- Backend API: Express.js running behind API routes
- Database: MongoDB Atlas
- File Storage: Secured cloud storage
- Hosting: Vercel

## Deployment Instructions

To deploy the latest version:

```bash
# Navigate to the frontend directory
cd packages/frontend

# Deploy to the subdirectory
npm run deploy:subdirectory
```

For more detailed instructions, refer to [SUBDIRECTORY_DEPLOY.md](./SUBDIRECTORY_DEPLOY.md).

## Monitoring and Maintenance

### Monitoring

The application uses Sentry for error tracking and monitoring. You can access the Sentry dashboard to:
- View real-time error reports
- Track performance issues
- Monitor user experience

### Backup and Recovery

Key data to backup regularly:
- MongoDB database (automated with MongoDB Atlas)
- User files and conversions

### Performance Optimization

To ensure optimal performance:
- Regularly clean up temporary files
- Set up a job to remove expired conversions and downloads
- Monitor API response times and optimize slow endpoints

## Security Considerations

PDFSpark handles document uploads and conversions, which requires attention to security:

1. **File Upload Security**:
   - Files are scanned for potential threats
   - Size and type restrictions are enforced
   - Temporary storage is secured and cleaned regularly

2. **Payment Security**:
   - All payment processing is handled through secure third-party providers
   - No payment details are stored in our system

3. **User Data Protection**:
   - Documents are encrypted at rest
   - Automatic deletion policies are in place
   - Downloads have expiration times

## Common Issues and Solutions

### Frontend Loading Issues

**Symptom**: Application assets fail to load or URLs return 404

**Solution**:
- Check that the base path is correctly set to `/pdfspark/`
- Verify that the Vercel configuration includes proper rewrites
- Clear CDN cache if necessary

### API Connection Issues

**Symptom**: API calls fail or return errors

**Solution**:
- Verify that the API base URL is correctly configured
- Check CORS settings on the backend
- Ensure authentication is working properly

### Deployment Failures

**Symptom**: Deployment process fails or site doesn't update

**Solution**:
- Check the Vercel deployment logs for specific errors
- Use the robust deployment script that includes fallback options:
  ```bash
  npm run robust-deploy
  ```
- Roll back to a previous working version if necessary

## Rollback Procedures

If a deployment causes issues:

1. Navigate to the Vercel project dashboard
2. Go to Deployments section
3. Find the last stable deployment
4. Click the three dots menu and select "Promote to Production"

## Contact Information

For urgent issues or assistance:
- Technical Support: tech@quicksparks.dev
- Development Team: dev@quicksparks.dev
- Emergency Contact: admin@quicksparks.dev