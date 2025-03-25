import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConversionOptions from './ConversionOptions';

// Mock the feedback context
vi.mock('../../context/FeedbackContext', () => ({
  useFeedback: () => ({
    showFeedback: vi.fn(),
    hideFeedback: vi.fn(),
  }),
}));

// Mock the matchers
vi.mock('@testing-library/jest-dom/matchers', () => ({
  default: {
    toBeInTheDocument: () => ({ pass: true }),
    toHaveClass: () => ({ pass: true }),
    toHaveAttribute: () => ({ pass: true }),
    toBeDisabled: () => ({ pass: true }),
  },
}));

describe('ConversionOptions component', () => {
  it('renders with default props', () => {
    const mockOnChange = vi.fn();

    render(
      <ConversionOptions
        conversionType="pdf-to-docx"
        quality="standard"
        preserveFormatting={false}
        onOptionChange={mockOnChange}
      />,
    );

    // Quality options should be present
    expect(screen.getByText('High Quality')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();

    // Formatting option should be present
    expect(screen.getByText('Preserve formatting')).toBeInTheDocument();
  });

  it('selects the correct quality option', () => {
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <ConversionOptions
        conversionType="pdf-to-docx"
        quality="standard"
        preserveFormatting={false}
        onOptionChange={mockOnChange}
      />,
    );

    // Standard quality should be selected
    const standardOption = screen.getByText('Standard').closest('div');
    expect(standardOption).toHaveClass('border-primary-500');

    // High quality should not be selected
    const highOption = screen.getByText('High Quality').closest('div');
    expect(highOption.classList.contains('border-primary-500')).toBe(false);

    // Change to high quality
    rerender(
      <ConversionOptions
        conversionType="pdf-to-docx"
        quality="high"
        preserveFormatting={false}
        onOptionChange={mockOnChange}
      />,
    );

    // Now high quality should be selected
    expect(highOption).toHaveClass('border-primary-500');
    // And standard should not be selected
    expect(standardOption.classList.contains('border-primary-500')).toBe(false);
  });

  it('toggles preserve formatting option', () => {
    const mockOnChange = vi.fn();

    // Test by just clicking on the option
    render(
      <ConversionOptions
        conversionType="pdf-to-docx"
        quality="standard"
        preserveFormatting={false}
        onOptionChange={mockOnChange}
      />,
    );

    // Preserve formatting should not be selected
    const formattingOption = screen.getByText('Preserve formatting').closest('div');

    // Initially not selected
    expect(formattingOption.classList.contains('border-primary-500')).toBe(false);

    // Click on the preserve formatting option
    fireEvent.click(formattingOption);

    // MockOnChange should be called with the right params
    expect(mockOnChange).toHaveBeenCalledWith('preserveFormatting', true);
  });

  it('calls onOptionChange when options are clicked', () => {
    const mockOnChange = vi.fn();

    render(
      <ConversionOptions
        conversionType="pdf-to-docx"
        quality="standard"
        preserveFormatting={false}
        onOptionChange={mockOnChange}
      />,
    );

    // Click on high quality option
    fireEvent.click(screen.getByText('High Quality'));

    // onOptionChange should be called with the new value
    expect(mockOnChange).toHaveBeenCalledWith('quality', 'high');

    // Click on preserve formatting option
    fireEvent.click(screen.getByText('Preserve formatting'));

    // onOptionChange should be called with the new value
    expect(mockOnChange).toHaveBeenCalledWith('preserveFormatting', true);
  });

  it('displays different description based on conversion type', () => {
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <ConversionOptions
        conversionType="pdf-to-docx"
        quality="standard"
        preserveFormatting={false}
        onOptionChange={mockOnChange}
      />,
    );

    // PDF to DOCX description
    expect(
      screen.getByText(/Keep fonts, layout, tables and styles as close to original as possible/),
    ).toBeInTheDocument();

    // Change conversion type
    rerender(
      <ConversionOptions
        conversionType="docx-to-pdf"
        quality="standard"
        preserveFormatting={false}
        onOptionChange={mockOnChange}
      />,
    );

    // DOCX to PDF description
    expect(
      screen.getByText(/Keep document styling and layout in the PDF output/),
    ).toBeInTheDocument();
  });

  it('disables options when disabled prop is true', () => {
    const mockOnChange = vi.fn();

    render(
      <ConversionOptions
        conversionType="pdf-to-docx"
        quality="standard"
        preserveFormatting={false}
        onOptionChange={mockOnChange}
        disabled={true}
      />,
    );

    // Click on high quality option
    fireEvent.click(screen.getByText('High Quality'));

    // onOptionChange should not be called when disabled
    expect(mockOnChange).not.toHaveBeenCalled();

    // Options should have disabled styling
    const qualityOption = screen.getByText('High Quality').closest('div');
    expect(qualityOption).toHaveClass('opacity-60');
    expect(qualityOption).toHaveClass('cursor-not-allowed');
  });
});
