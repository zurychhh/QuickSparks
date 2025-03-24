import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'danger';
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Is button full width
   */
  fullWidth?: boolean;
}

/**
 * Primary UI component for user interaction
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  ...props
}) => {
  const baseStyle = {
    fontFamily: 'sans-serif',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#f1f1f1',
      color: '#333',
      border: '1px solid #ddd',
    },
    danger: {
      backgroundColor: '#e74c3c',
      color: 'white',
    },
  };

  const sizeStyles = {
    small: {
      padding: '8px 12px',
      fontSize: '14px',
    },
    medium: {
      padding: '10px 16px',
      fontSize: '16px',
    },
    large: {
      padding: '12px 20px',
      fontSize: '18px',
    },
  };

  const style = {
    ...baseStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button style={style} {...props}>
      {children}
    </button>
  );
};

export default Button;