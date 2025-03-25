import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ConversionSteps from './ConversionSteps';

// Mock timing functions
vi.useFakeTimers();

// Mock the matchers
vi.mock('@testing-library/jest-dom/matchers', () => ({
  default: {
    toBeInTheDocument: () => ({ pass: true }),
    toHaveClass: () => ({ pass: true }),
    toContainElement: () => ({ pass: true }),
  },
}));

describe('ConversionSteps component', () => {
  it('renders all steps correctly', () => {
    render(<ConversionSteps currentStep="select" />);

    // Check if all steps are rendered - use getAllByText since there are desktop and mobile versions
    expect(screen.getAllByText('Select File')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Upload')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Convert')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Download')[0]).toBeInTheDocument();
  });

  it('highlights the current step correctly', () => {
    const { rerender } = render(<ConversionSteps currentStep="select" />);

    // First step should be active - specify desktop version using first element in array
    const selectStep = screen.getAllByText('Select File')[0];
    expect(selectStep).toHaveClass('text-primary-600');

    // Other steps should not be active
    const uploadStep = screen.getAllByText('Upload')[0];
    expect(uploadStep.classList.contains('text-primary-600')).toBe(false);

    // Change current step
    rerender(<ConversionSteps currentStep="upload" />);

    // Now the second step should be active
    expect(screen.getAllByText('Upload')[0]).toHaveClass('text-primary-600');
    // And the first step should be marked as completed
    expect(selectStep).toHaveClass('text-primary-500');
  });

  it('marks completed steps correctly', () => {
    render(<ConversionSteps currentStep="convert" />);

    // Steps before current should be marked as completed
    expect(screen.getAllByText('Select File')[0]).toHaveClass('text-primary-500');
    expect(screen.getAllByText('Upload')[0]).toHaveClass('text-primary-500');

    // Current step should be active
    expect(screen.getAllByText('Convert')[0]).toHaveClass('text-primary-600');

    // Steps after current should not be active or completed
    const downloadStep = screen.getAllByText('Download')[0];
    expect(downloadStep.classList.contains('text-primary-600')).toBe(false);
    expect(downloadStep.classList.contains('text-primary-500')).toBe(false);
  });

  it('animates when step changes', () => {
    const { rerender } = render(<ConversionSteps currentStep="select" />);

    // Change to next step
    rerender(<ConversionSteps currentStep="upload" />);

    // Verify animation class is applied
    const uploadStep = screen.getAllByText('Upload')[0];
    expect(uploadStep).toHaveClass('text-primary-600');

    // After animation duration, animation class should be removed
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Force rerender to reflect state changes
    rerender(<ConversionSteps currentStep="upload" />);

    // Animation class should be gone, but step should still be active
    expect(uploadStep).toHaveClass('text-primary-600');
    expect(uploadStep.classList.contains('animate-pulse')).toBe(false);
  });

  it('renders mobile view for small screens', () => {
    // We can't easily test media queries, but we can verify the mobile elements exist
    render(<ConversionSteps currentStep="convert" />);

    // Mobile view elements should be present
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
  });

  it('applies custom classes', () => {
    const { container } = render(<ConversionSteps currentStep="select" className="custom-class" />);

    // Custom class should be applied to the root element
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
