import { useState, useEffect } from 'react';
import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import { classNames } from '@utils/classnames';
import { useSubscriptionStore } from '../../store/subscriptionStore';

// NavLink component definition
type NavLinkProps = {
  to: string;
  children: React.ReactNode;
};

const NavLink = ({ to, children }: NavLinkProps): React.ReactElement => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        classNames(
          'text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium',
          isActive ? 'text-primary-600 font-semibold' : '',
        )
      }
    >
      {children}
    </RouterNavLink>
  );
};

// MobileNavLink component definition
type MobileNavLinkProps = {
  to: string;
  children: React.ReactNode;
  onClick: () => void;
};

const MobileNavLink = ({ to, children, onClick }: MobileNavLinkProps): React.ReactElement => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        classNames(
          'block px-3 py-2 rounded-md text-base font-medium',
          isActive
            ? 'text-primary-600 bg-primary-50'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50',
        )
      }
      onClick={onClick}
    >
      {children}
    </RouterNavLink>
  );
};

// Main Navbar component
const Navbar = (): React.ReactElement => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { subscription, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    setIsLoggedIn(!!token);
    
    // If logged in, fetch subscription
    if (token) {
      fetchSubscription();
    }
  }, [fetchSubscription]);

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="block h-8 w-auto"
                src="/logo.svg"
                alt="PDFSpark"
              />
              <span className="ml-2 text-xl font-bold text-gray-900">PDFSpark</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/convert">Convert</NavLink>
              <NavLink to="/product">Product</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>
              <NavLink to="/about">About</NavLink>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isLoggedIn ? (
              <>
                {subscription && subscription.status === 'active' && (
                  <span className="mr-4 px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                    {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                  </span>
                )}
                <div className="mr-4 relative group">
                  <Link
                    to="/account"
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Account
                  </Link>
                  <div className="hidden group-hover:block absolute left-0 mt-1 bg-white shadow-lg rounded-md py-1 w-48 z-10">
                    <Link 
                      to="/account" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Payment History
                    </Link>
                    <Link 
                      to="/account/downloads" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Downloads
                    </Link>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signup">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Sign Up
                  </button>
                </Link>
                <Link to="/login">
                  <button
                    type="button"
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Log In
                  </button>
                </Link>
              </>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <MobileNavLink to="/" onClick={toggleMenu}>Home</MobileNavLink>
          <MobileNavLink to="/convert" onClick={toggleMenu}>Convert</MobileNavLink>
          <MobileNavLink to="/product" onClick={toggleMenu}>Product</MobileNavLink>
          <MobileNavLink to="/pricing" onClick={toggleMenu}>Pricing</MobileNavLink>
          <MobileNavLink to="/about" onClick={toggleMenu}>About</MobileNavLink>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="mt-3 space-y-1">
            {isLoggedIn ? (
              <>
                <MobileNavLink to="/account" onClick={toggleMenu}>Payment History</MobileNavLink>
                <MobileNavLink to="/account/downloads" onClick={toggleMenu}>My Downloads</MobileNavLink>
                <button
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signup">
                  <button
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={toggleMenu}
                  >
                    Sign Up
                  </button>
                </Link>
                <Link to="/login">
                  <button
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={toggleMenu}
                  >
                    Log In
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;