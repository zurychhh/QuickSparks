import React from 'react'
import { cn } from '@utils/classnames'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      id,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`
    
    // Base classes
    const baseInputClasses = 'block px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-400 sm:text-sm'
    
    // State classes
    const stateClasses = error
      ? 'border-error-500 focus:ring-error-500 focus:border-error-500'
      : 'focus:ring-primary-500 focus:border-primary-500'
    
    // Width class
    const widthClass = fullWidth ? 'w-full' : 'w-auto'
    
    // Icon classes
    const hasLeftIcon = leftIcon ? 'pl-10' : ''
    const hasRightIcon = rightIcon ? 'pr-10' : ''
    
    return (
      <div className={cn(widthClass, className)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseInputClasses,
              stateClasses,
              hasLeftIcon,
              hasRightIcon,
              'w-full'
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="mt-1">
            {error ? (
              <p id={`${inputId}-error`} className="text-xs text-error-600">
                {error}
              </p>
            ) : helperText ? (
              <p id={`${inputId}-helper`} className="text-xs text-gray-500">
                {helperText}
              </p>
            ) : null}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input