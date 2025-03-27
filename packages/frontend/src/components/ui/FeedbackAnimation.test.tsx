import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import FeedbackAnimation, { FeedbackType } from './FeedbackAnimation';

// Mock timing functions
vi.useFakeTimers();

// Mock the matchers
vi.mock('@testing-library/jest-dom/matchers', () => ({
  default: {
    toBeInTheDocument: () => ({ pass: true }),
    toHaveClass: () => ({ pass: true }),
    toBeDisabled: () => ({ pass: true }),
    toContainElement: () => ({ pass: true }),
  },
}));

describe('FeedbackAnimation component', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders correctly with default props', () => {
    render(<FeedbackAnimation type="success" message="Operation successful" />);

    // After 10ms, component should be visible due to the useEffect setTimeout
    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText('Operation successful')).toBeInTheDocument();

    // Should have the success styling
    const container = screen.getByText('Operation successful').parentElement;
    expect(container).toHaveClass('bg-green-100');
  });

  it('renders different types of feedback', () => {
    const feedbackTypes: FeedbackType[] = ['success', 'error', 'info', 'warning', 'loading'];

    feedbackTypes.forEach(type => {
      const { unmount } = render(<FeedbackAnimation type={type} message={`${type} message`} />);

      act(() => {
        vi.advanceTimersByTime(10); // Wait for animation
      });

      expect(screen.getByText(`${type} message`)).toBeInTheDocument();

      unmount();
    });
  });

  it('auto-hides after duration', () => {
    const onCompleteMock = vi.fn();
    const { rerender } = render(
      <FeedbackAnimation
        type="success"
        message="Will hide"
        duration={1000}
        onComplete={onCompleteMock}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(10); // Initial animation
    });

    expect(screen.getByText('Will hide')).toBeInTheDocument();

    // After duration + animation time, onComplete should be called
    act(() => {
      vi.advanceTimersByTime(1000); // Duration
      vi.advanceTimersByTime(300); // Exit animation
    });

    expect(onCompleteMock).toHaveBeenCalled();

    // Force rerender to reflect state changes
    rerender(
      <FeedbackAnimation
        type="success"
        message="Will hide"
        duration={1000}
        onComplete={onCompleteMock}
        show={false}
      />,
    );
  });

  it('stays visible when persistent is true', () => {
    const onCompleteMock = vi.fn();
    render(
      <FeedbackAnimation
        type="success"
        message="Stays visible"
        duration={1000}
        onComplete={onCompleteMock}
        persistent={true}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(10); // Initial animation
    });

    expect(screen.getByText('Stays visible')).toBeInTheDocument();

    // Even after duration + animation time, onComplete should not be called
    act(() => {
      vi.advanceTimersByTime(1000); // Duration
      vi.advanceTimersByTime(300); // Exit animation
    });

    expect(onCompleteMock).not.toHaveBeenCalled();
    expect(screen.getByText('Stays visible')).toBeInTheDocument();
  });

  it('hides when show prop changes to false', () => {
    const onCompleteMock = vi.fn();
    const { rerender } = render(
      <FeedbackAnimation
        type="success"
        message="Will hide"
        onComplete={onCompleteMock}
        show={true}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(10); // Initial animation
    });

    expect(screen.getByText('Will hide')).toBeInTheDocument();

    // Change show to false
    rerender(
      <FeedbackAnimation
        type="success"
        message="Will hide"
        onComplete={onCompleteMock}
        show={false}
      />,
    );

    // After exit animation, onComplete should be called
    act(() => {
      vi.advanceTimersByTime(300); // Exit animation
    });

    expect(onCompleteMock).toHaveBeenCalled();
  });

  it('renders with custom icon', () => {
    const customIcon = <div data-testid="custom-icon">🌟</div>;

    render(<FeedbackAnimation type="success" message="Custom icon" icon={customIcon} />);

    act(() => {
      vi.advanceTimersByTime(10); // Initial animation
    });

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByText('Custom icon')).toBeInTheDocument();
  });
});
