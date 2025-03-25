import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import FeedbackAnimation, { FeedbackType } from '../components/ui/FeedbackAnimation';

interface FeedbackContextProps {
  showFeedback: (
    type: FeedbackType,
    message: string,
    duration?: number,
    persistent?: boolean,
  ) => void;
  hideFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextProps | undefined>(undefined);

export const useFeedback = (): FeedbackContextProps => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [feedback, setFeedback] = useState<{
    show: boolean;
    type: FeedbackType;
    message: string;
    duration: number;
    persistent: boolean;
  } | null>(null);

  // Optimize with useCallback to prevent unnecessary recreations on render
  const showFeedback = useCallback(
    (type: FeedbackType, message: string, duration = 3000, persistent = false) => {
      // Debounce multiple rapid feedback calls for the same type
      setFeedback(prev => {
        // If we already have the same type of feedback showing, just update it
        if (prev && prev.type === type && prev.show) {
          return {
            show: true,
            type,
            message,
            duration,
            persistent,
          };
        }

        return {
          show: true,
          type,
          message,
          duration,
          persistent,
        };
      });
    },
    [],
  );

  // Optimize with useCallback to prevent unnecessary recreations on render
  const hideFeedback = useCallback(() => {
    if (feedback) {
      setFeedback({ ...feedback, show: false });
      // Reset feedback state after animation completes
      setTimeout(() => {
        setFeedback(null);
      }, 300);
    }
  }, [feedback]);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({ showFeedback, hideFeedback }),
    [showFeedback, hideFeedback],
  );

  // Memoize the feedback component to prevent unnecessary re-renders
  const feedbackComponent = useMemo(() => {
    if (!feedback) return null;

    return (
      <FeedbackAnimation
        type={feedback.type}
        message={feedback.message}
        duration={feedback.duration}
        show={feedback.show}
        persistent={feedback.persistent}
        onComplete={() => setFeedback(null)}
      />
    );
  }, [feedback]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      {feedbackComponent}
    </FeedbackContext.Provider>
  );
};
