import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the AuthContext type
interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  login: (token: string) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider component for authentication functionality
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Call the auth status endpoint
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          credentials: 'include', // Important: include cookies
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Parse response
        if (response.ok) {
          const data = await response.json();
          const authenticated = data.authenticated === true;
          setIsAuthenticated(authenticated);
          if (authenticated && data.token) {
            setToken(data.token);
          }
        } else {
          // If response is not OK, user is not authenticated
          setIsAuthenticated(false);
          setToken(null);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // Login function
  const login = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API endpoint to clear the HttpOnly cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Update local state
        setIsAuthenticated(false);
        setToken(null);
      } else {
        console.error('Logout failed:', await response.text());
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    token,
    setToken,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication functionality
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;