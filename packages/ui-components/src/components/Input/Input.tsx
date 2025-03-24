import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input label
   */
  label?: string;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Full width input
   */
  fullWidth?: boolean;
}

/**
 * Input component for collecting user data
 */
export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  fullWidth = false,
  ...props
}) => {
  const containerStyle = {
    display: 'inline-block',
    fontFamily: 'sans-serif',
    width: fullWidth ? '100%' : 'auto',
    marginBottom: '16px',
  };
  
  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    marginBottom: '6px',
    fontWeight: 500,
    color: error ? '#e74c3c' : '#333',
  };
  
  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '8px 10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: `1px solid ${error ? '#e74c3c' : '#ddd'}`,
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const,
  };
  
  const helperTextStyle = {
    display: 'block',
    marginTop: '6px',
    fontSize: '12px',
    color: error ? '#e74c3c' : '#666',
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <input style={inputStyle} {...props} />
      {(helperText || error) && (
        <span style={helperTextStyle}>{error || helperText}</span>
      )}
    </div>
  );
};

export default Input;