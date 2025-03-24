import React, { ReactNode } from 'react';

export interface CardProps {
  /**
   * Card title
   */
  title?: string;
  /**
   * Card content
   */
  children: ReactNode;
  /**
   * Card footer content
   */
  footer?: ReactNode;
  /**
   * Card elevation level
   */
  elevation?: 0 | 1 | 2 | 3;
}

/**
 * Card component for displaying content in a contained box
 */
export const Card: React.FC<CardProps> = ({
  title,
  children,
  footer,
  elevation = 1,
}) => {
  const elevationStyles = {
    0: { boxShadow: 'none', border: '1px solid #ddd' },
    1: { boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' },
    2: { boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)' },
    3: { boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)' },
  };
  
  const style = {
    borderRadius: '4px',
    backgroundColor: 'white',
    overflow: 'hidden',
    ...elevationStyles[elevation],
  };
  
  const titleStyle = {
    padding: '16px',
    borderBottom: '1px solid #eee',
    fontWeight: 'bold',
    fontSize: '18px',
  };
  
  const contentStyle = {
    padding: '16px',
  };
  
  const footerStyle = {
    padding: '16px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9',
  };

  return (
    <div style={style}>
      {title && <div style={titleStyle}>{title}</div>}
      <div style={contentStyle}>{children}</div>
      {footer && <div style={footerStyle}>{footer}</div>}
    </div>
  );
};

export default Card;