# PDFSpark Technical Documentation

## Architecture Overview

PDFSpark is a web application built with a modern technology stack:

- **Frontend**: React application with TypeScript, Vite, and TailwindCSS
- **Backend**: Node.js microservices for conversion, authentication, and payment processing
- **Infrastructure**: Deployed on Vercel (frontend) and AWS Lambda (backend services)
- **Data Storage**: MongoDB for user data, AWS S3 for file storage
- **Authentication**: JWT-based token authentication
- **Payment Processing**: Stripe integration

## Frontend Architecture

### Core Technologies
- **React 18**: For component-based UI
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and development server
- **React Router v6**: Client-side routing
- **Zustand**: State management
- **TailwindCSS**: Utility-first CSS framework
- **Vitest & React Testing Library**: Testing framework

### Folder Structure

```
/src
  /assets       # Static assets like images
  /components   # Reusable UI components
    /layout     # Layout components
    /ui         # Basic UI components
    /forms      # Form-related components
  /context      # React context providers
  /hooks        # Custom React hooks
  /pages        # Page components (routes)
  /services     # API and external service integrations
  /store        # Zustand state stores
  /utils        # Utility functions
  /types        # TypeScript type definitions
  main.tsx      # Application entry point
  App.tsx       # Main App component
```

### State Management

The application uses Zustand for global state management:

- `useAuthStore`: Authentication state (current user, tokens)
- `useConversionStore`: Conversion state (files, progress, results)
- `useUIStore`: UI state (modals, sidebars, theme preferences)

### Routing

React Router v6 is used for client-side routing with a basename of `/pdfspark` for subdirectory deployment:

```tsx
<Router basename="/pdfspark">
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="convert" element={<ConversionPage />} />
      <Route path="convert/:id" element={<ConversionPage />} />
      // Other routes...
    </Route>
  </Routes>
</Router>
```

### API Integration

API requests are handled through a centralized API service that includes:
- Authentication token management
- Request/response interceptors
- Error handling

Example of API service in `/services/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Request interceptor to add auth tokens
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 unauthorized errors
    if (error.response && error.response.status === 401) {
      // Refresh token or redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Analytics

Google Analytics 4 is integrated throughout the application:

- Page views are tracked automatically on route changes
- Custom events are tracked for user interactions
- E-commerce events track conversion actions

Example GA4 integration:

```typescript
// In App.tsx or Layout component
useAnalytics(); // Custom hook that initializes GA and tracks page views

// In a component with user interactions
const { trackEvent } = useAnalytics();

// Track a conversion event
trackEvent({
  category: 'Conversion',
  action: 'StartConversion',
  label: fileType
});
```

## Deployment

### Vercel Configuration

The application is configured for deployment on Vercel with a subdirectory path:

1. **Base URL Configuration**:
   - `vite.config.ts`: `base: '/pdfspark/'`
   - React Router: `basename="/pdfspark"`

2. **Routing Rules** (vercel.json):
   - Rewrites for `/pdfspark` and `/pdfspark/*` paths
   - Redirects from root paths to `/pdfspark/*` equivalents
   - Custom caching headers for static assets

### Security Headers

The application includes the following security headers:

- `Strict-Transport-Security`: Enforces HTTPS
- `X-Content-Type-Options`: Prevents MIME type sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: Adds XSS protection
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features

## Testing

### Unit Testing

Unit tests are written using Vitest and React Testing Library:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

Run tests with:
- `npm run test`: Run all tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate coverage report

### Performance Testing

Performance testing is done with Lighthouse:

```
npm run lighthouse
```

This runs a Lighthouse audit against the production URL and generates reports for:
- Performance
- Accessibility
- Best Practices
- SEO

### Security Testing

Security tests check for:
- Missing or weak HTTP security headers
- Dependency vulnerabilities
- Client-side security risks

Run security tests with:
```
node tools/security-scan.mjs
```

## Monitoring and Analytics

### Error Monitoring

Sentry is configured to track and report errors:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});
```

### Performance Monitoring

- Lighthouse CI for performance metrics
- Custom performance tracking with Web Vitals

### Usage Analytics

Google Analytics 4 is used to track:
- Page views
- User engagement
- Conversion events
- E-commerce actions

## Extending the Application

### Adding New Pages

1. Create a new page component in `/src/pages`
2. Add the route to `App.tsx`
3. Update the navigation component if needed

### Adding New Features

1. Identify required components and state
2. Add new state to the appropriate store
3. Create or update components
4. Add necessary API endpoints
5. Write tests for the new functionality

## Troubleshooting Guide

### Common Development Issues

1. **CORS Errors**: Check proxy settings in `vite.config.ts`
2. **Build Errors**: Verify import paths and TypeScript types
3. **State Management**: Check Zustand store subscriptions for memory leaks

### Production Debug Mode

Enable production debugging by adding the query parameter `?debug=true` to any page URL.