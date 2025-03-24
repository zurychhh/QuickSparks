import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@utils/classnames';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/logo.svg"
                alt="QuickSparks"
              />
              <span className="ml-2 text-xl font-bold text-primary-600">QuickSparks</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/convert">Convert</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>
              <NavLink to="/about">About</NavLink>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign up
            </Link>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded="false"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              {/* Heroicon name: menu */}
              <svg
                className={cn('h-6 w-6', isMobileMenuOpen ? 'hidden' : 'block')}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Heroicon name: x */}
              <svg
                className={cn('h-6 w-6', isMobileMenuOpen ? 'block' : 'hidden')}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn('sm:hidden', isMobileMenuOpen ? 'block' : 'hidden')}>
        <div className="pt-2 pb-3 space-y-1">
          <MobileNavLink to="/">Home</MobileNavLink>
          <MobileNavLink to="/convert">Convert</MobileNavLink>
          <MobileNavLink to="/pricing">Pricing</MobileNavLink>
          <MobileNavLink to="/about">About</MobileNavLink>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <img
                className="h-10 w-10 rounded-full"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">Guest User</div>
              <div className="text-sm font-medium text-gray-500">guest@example.com</div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Link
              to="/login"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string
  children: React.ReactNode
  className?: string
}

const NavLink = ({ to, children, className }: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
        'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
        className,
      )}
    >
      {children}
    </Link>
  );
};

const MobileNavLink = ({ to, children, className }: NavLinkProps) => {
  return (
    <Link
      to={to}
      className={cn(
        'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
        'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
        className,
      )}
    >
      {children}
    </Link>
  );
};

export default Navbar;