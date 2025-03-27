import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input Component', () => {
  it('renders basic input correctly', () => {
    render(<Input placeholder="Enter text" />);
    
    const inputElement = screen.getByPlaceholderText('Enter text');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement.tagName).toBe('INPUT');
  });

  it('renders with a label', () => {
    render(<Input label="Username" placeholder="Enter username" />);
    
    const labelElement = screen.getByText('Username');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement.tagName).toBe('LABEL');
    
    const inputElement = screen.getByPlaceholderText('Enter username');
    expect(inputElement).toBeInTheDocument();
    
    // Check that the label is properly associated with the input
    expect(labelElement.getAttribute('for')).toBe(inputElement.getAttribute('id'));
  });

  it('renders with helper text', () => {
    render(<Input helperText="Must be at least 8 characters" placeholder="Password" />);
    
    const helperTextElement = screen.getByText('Must be at least 8 characters');
    expect(helperTextElement).toBeInTheDocument();
    
    const inputElement = screen.getByPlaceholderText('Password');
    expect(inputElement).toHaveAttribute('aria-describedby', expect.stringContaining('-helper'));
  });

  it('renders with error message', () => {
    render(<Input error="This field is required" placeholder="Required field" />);
    
    const errorElement = screen.getByText('This field is required');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveClass('text-error-600');
    
    const inputElement = screen.getByPlaceholderText('Required field');
    expect(inputElement).toHaveAttribute('aria-invalid', 'true');
    expect(inputElement).toHaveAttribute('aria-describedby', expect.stringContaining('-error'));
  });

  it('prioritizes error over helper text when both are provided', () => {
    render(
      <Input 
        error="Invalid input" 
        helperText="This helper text should not be visible" 
        placeholder="Test input" 
      />
    );
    
    expect(screen.getByText('Invalid input')).toBeInTheDocument();
    expect(screen.queryByText('This helper text should not be visible')).not.toBeInTheDocument();
  });

  it('handles input value changes', () => {
    const handleChange = vi.fn();
    
    render(<Input placeholder="Changeable input" onChange={handleChange} />);
    
    const inputElement = screen.getByPlaceholderText('Changeable input');
    fireEvent.change(inputElement, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('applies fullWidth prop correctly', () => {
    const { container: fullWidthContainer } = render(<Input fullWidth placeholder="Full width" />);
    const { container: defaultWidthContainer } = render(<Input placeholder="Default width" />);
    
    const fullWidthWrapper = fullWidthContainer.firstChild;
    const defaultWidthWrapper = defaultWidthContainer.firstChild;
    
    expect(fullWidthWrapper).toHaveClass('w-full');
    expect(defaultWidthWrapper).toHaveClass('w-auto');
  });

  it('applies custom className correctly', () => {
    const { container } = render(<Input className="custom-test-class" placeholder="Custom class" />);
    
    const wrapperElement = container.firstChild;
    expect(wrapperElement).toHaveClass('custom-test-class');
  });

  it('renders with left icon', () => {
    render(
      <Input 
        leftIcon={<span data-testid="left-icon">🔍</span>} 
        placeholder="Search" 
      />
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    
    const inputElement = screen.getByPlaceholderText('Search');
    expect(inputElement).toHaveClass('pl-10');
  });

  it('renders with right icon', () => {
    render(
      <Input 
        rightIcon={<span data-testid="right-icon">✓</span>} 
        placeholder="Verified" 
      />
    );
    
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    
    const inputElement = screen.getByPlaceholderText('Verified');
    expect(inputElement).toHaveClass('pr-10');
  });

  it('passes additional props to the input element', () => {
    render(
      <Input 
        placeholder="Test" 
        maxLength={10} 
        required 
        data-testid="test-input" 
      />
    );
    
    const inputElement = screen.getByPlaceholderText('Test');
    expect(inputElement).toHaveAttribute('maxLength', '10');
    expect(inputElement).toHaveAttribute('required');
    expect(inputElement).toHaveAttribute('data-testid', 'test-input');
  });

  it('forwards ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    
    render(<Input ref={ref} placeholder="Ref test" />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('INPUT');
    expect(ref.current?.placeholder).toBe('Ref test');
  });
});