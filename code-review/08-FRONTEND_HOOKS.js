/**
 * 08-FRONTEND_HOOKS.js
 * 
 * This file contains custom React hooks used in the frontend.
 */

// Authentication Hook
// ===============
// packages/frontend/src/hooks/useAuth.ts
const useAuthHook = `
import { useState, useEffect, useContext, createContext } from 'react';
import apiService from '../services/api';
import apiConfig from '../config/api.config';

// User interface
interface User {
  id: string;
  email: string;
  name: string;
  isSubscribed: boolean;
  subscriptionTier?: string;
  createdAt: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
});

// Provider component that wraps the app and makes auth available to any child component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Get current user data
        const response = await apiService.get(\`\${apiConfig.endpoints.auth}/me\`);
        setUser(response.data.user);
        setError(null);
      } catch (err) {
        // Clear invalid token
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login user
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.post(\`\${apiConfig.endpoints.auth}/login\`, {
        email,
        password,
      });
      
      const { token, user } = response.data;
      
      // Store token
      localStorage.setItem('auth_token', token);
      
      // Set user state
      setUser(user);
      
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register new user
  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.post(\`\${apiConfig.endpoints.auth}/register\`, {
        name,
        email,
        password,
      });
      
      const { token, user } = response.data;
      
      // Store token
      localStorage.setItem('auth_token', token);
      
      // Set user state
      setUser(user);
      
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout user
  const logout = () => {
    // Remove token
    localStorage.removeItem('auth_token');
    
    // Reset state
    setUser(null);
    setError(null);
  };
  
  // Clear error
  const clearError = () => {
    setError(null);
  };
  
  // Compute authenticated status
  const isAuthenticated = !!user;
  
  // Create context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
`;

// Analytics Hook
// ===========
// packages/frontend/src/hooks/useAnalytics.ts
const useAnalyticsHook = `
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackEvent } from '../utils/analytics';
import { usePrevious } from './usePrevious';

/**
 * Hook for tracking analytics events and page views
 */
export function useAnalytics() {
  const location = useLocation();
  const previousPathname = usePrevious(location.pathname);
  
  // Track page view when location changes
  useEffect(() => {
    if (location.pathname !== previousPathname) {
      trackPageView(location.pathname);
    }
  }, [location.pathname, previousPathname]);
  
  // Event tracking function
  const trackEventCallback = useCallback((
    eventName: string, 
    properties?: Record<string, any>
  ) => {
    trackEvent(eventName, properties);
  }, []);
  
  return {
    trackEvent: trackEventCallback,
  };
}
`;

// Previous Value Hook
// ===============
// packages/frontend/src/hooks/usePrevious.ts
const usePreviousHook = `
import { useRef, useEffect } from 'react';

/**
 * Hook to store and retrieve the previous value of a state or prop
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}
`;

// A/B Testing Hook
// =============
// packages/frontend/src/hooks/useABTesting.ts
const useABTestingHook = `
import { useState, useEffect } from 'react';
import { getVariant, trackVariantImpression } from '../utils/ab-testing';

/**
 * Hook for implementing A/B testing
 */
export function useABTesting(testId: string, defaultVariant: string = 'control') {
  const [variant, setVariant] = useState<string>(defaultVariant);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchVariant = async () => {
      try {
        const userVariant = await getVariant(testId);
        setVariant(userVariant);
        
        // Track impression
        trackVariantImpression(testId, userVariant);
      } catch (error) {
        console.error('Failed to get A/B test variant:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVariant();
  }, [testId]);
  
  return {
    variant,
    isLoading,
    isControl: variant === 'control',
    isVariantA: variant === 'variant_a',
    isVariantB: variant === 'variant_b',
  };
}
`;

// Responsive Hook
// ===========
// packages/frontend/src/hooks/useResponsive.ts
const useResponsiveHook = `
import { useState, useEffect } from 'react';

// Breakpoint definitions
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Type for breakpoint names
type Breakpoint = keyof typeof breakpoints;

/**
 * Hook for responsive design based on viewport size
 */
export function useResponsive() {
  // Initialize with default values
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('sm');
  
  useEffect(() => {
    // Function to update breakpoints based on window size
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      
      // Set device type
      setIsMobile(width < breakpoints.md);
      setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
      setIsDesktop(width >= breakpoints.lg);
      
      // Set current breakpoint
      if (width < breakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else if (width < breakpoints.md) {
        setCurrentBreakpoint('sm');
      } else if (width < breakpoints.lg) {
        setCurrentBreakpoint('md');
      } else if (width < breakpoints.xl) {
        setCurrentBreakpoint('lg');
      } else if (width < breakpoints['2xl']) {
        setCurrentBreakpoint('xl');
      } else {
        setCurrentBreakpoint('2xl');
      }
    };
    
    // Call once on mount
    updateBreakpoints();
    
    // Add resize listener
    window.addEventListener('resize', updateBreakpoints);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateBreakpoints);
    };
  }, []);
  
  // Helper function to check if current width is greater than a breakpoint
  const isAbove = (breakpoint: Breakpoint): boolean => {
    return window.innerWidth >= breakpoints[breakpoint];
  };
  
  // Helper function to check if current width is less than a breakpoint
  const isBelow = (breakpoint: Breakpoint): boolean => {
    return window.innerWidth < breakpoints[breakpoint];
  };
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    isAbove,
    isBelow,
    breakpoints,
  };
}
`;