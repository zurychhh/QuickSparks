import React from 'react';
import { cn } from '@utils/classnames';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    // Base classes for all button variants
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-colors duration-200';
    
    // Size variations
    const sizeClasses = {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
      xl: 'px-6 py-3 text-lg',
    };
    
    // Variant variations
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow',
      secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 shadow',
      outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
      link: 'bg-transparent text-primary-600 hover:text-primary-700 hover:underline focus:ring-0 shadow-none',
      danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-2 focus:ring-offset-2 focus:ring-error-500 shadow',
    };
    
    // Disabled & Loading states
    const stateClasses = (disabled || isLoading) 
      ? 'opacity-60 cursor-not-allowed' 
      : 'cursor-pointer';
    
    // Full width class
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          stateClasses,
          widthClass,
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;