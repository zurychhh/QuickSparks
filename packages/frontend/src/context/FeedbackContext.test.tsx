import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FeedbackProvider, useFeedback } from './FeedbackContext';
import { FC } from 'react';

// Mock timing functions
vi.useFakeTimers();

// Mock FeedbackAnimation component
vi.mock('../components/ui/FeedbackAnimation', () => ({
  default: vi.fn(({ type, message, show, _onComplete }) =>
    show ? (
      <div data-testid="mock-feedback" data-type={type}>
        {message}
      </div>
    ) : null,
  ),
}));

// Mock component that uses the FeedbackContext
const TestComponent: FC = () => {
  const { showFeedback, hideFeedback } = useFeedback();

  return (
    <div>
      <button
        onClick={() => showFeedback('success', 'Test success message')}
        data-testid="show-success"
      >
        Show Success
      </button>
      <button onClick={() => showFeedback('error', 'Test error message')} data-testid="show-error">
        Show Error
      </button>
      <button
        onClick={() => showFeedback('info', 'Test info message', 5000, true)}
        data-testid="show-persistent"
      >
        Show Persistent
      </button>
      <button onClick={() => hideFeedback()} data-testid="hide-feedback">
        Hide Feedback
      </button>
    </div>
  );
};

describe('FeedbackContext', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('provides context to children', () => {
    render(
      <FeedbackProvider>
        <TestComponent />
      </FeedbackProvider>,
    );

    expect(screen.getByTestId('show-success')).toBeInTheDocument();
    expect(screen.getByTestId('show-error')).toBeInTheDocument();
    expect(screen.getByTestId('hide-feedback')).toBeInTheDocument();
  });

  it('shows feedback when showFeedback is called', () => {
    render(
      <FeedbackProvider>
        <TestComponent />
      </FeedbackProvider>,
    );

    // Click the button to show success feedback
    act(() => {
      screen.getByTestId('show-success').click();
    });

    // Advance timers for the animation to start
    act(() => {
      vi.advanceTimersByTime(10);
    });

    // Feedback should be visible
    expect(screen.getByTestId('mock-feedback')).toBeInTheDocument();
    expect(screen.getByText('Test success message')).toBeInTheDocument();
  });

  it('hides feedback when hideFeedback is called', () => {
    render(
      <FeedbackProvider>
        <TestComponent />
      </FeedbackProvider>,
    );

    // Show feedback
    act(() => {
      screen.getByTestId('show-success').click();
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByTestId('mock-feedback')).toBeInTheDocument();

    // Hide feedback
    act(() => {
      screen.getByTestId('hide-feedback').click();
      // After animation completes, feedback should be removed
      vi.advanceTimersByTime(300);
    });

    // Check if the feedback is no longer in the document
    expect(screen.queryByTestId('mock-feedback')).toBeNull();
  });

  it('shows different types of feedback', () => {
    render(
      <FeedbackProvider>
        <TestComponent />
      </FeedbackProvider>,
    );

    // Show success feedback
    act(() => {
      screen.getByTestId('show-success').click();
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText('Test success message')).toBeInTheDocument();

    // Show error feedback (replacing the success one)
    act(() => {
      screen.getByTestId('show-error').click();
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('accepts custom duration and persistent settings', () => {
    render(
      <FeedbackProvider>
        <TestComponent />
      </FeedbackProvider>,
    );

    // Show persistent feedback with custom duration
    act(() => {
      screen.getByTestId('show-persistent').click();
      vi.advanceTimersByTime(10);
    });

    // Feedback should be visible
    expect(screen.getByText('Test info message')).toBeInTheDocument();

    // Even after typical duration, it should still be visible (because it's persistent)
    act(() => {
      vi.advanceTimersByTime(5000);
      vi.advanceTimersByTime(300); // Animation time
    });

    expect(screen.getByText('Test info message')).toBeInTheDocument();
  });

  it('throws an error when useFeedback is used outside provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useFeedback must be used within a FeedbackProvider');

    // Restore console.error
    consoleErrorMock.mockRestore();
  });
});
