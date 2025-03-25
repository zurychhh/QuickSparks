import React, { createContext, useState, useContext, ReactNode } from 'react';
import FeedbackAnimation, { FeedbackType } from '@components/ui/FeedbackAnimation';

interface FeedbackContextProps {
  showFeedback: (type: FeedbackType, message: string, duration?: number, persistent?: boolean) => void;
  hideFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextProps | undefined>(undefined);

export const useFeedback = () => {
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

  const showFeedback = (
    type: FeedbackType,
    message: string,
    duration = 3000,
    persistent = false
  ) => {
    setFeedback({
      show: true,
      type,
      message,
      duration,
      persistent,
    });
  };

  const hideFeedback = () => {
    if (feedback) {
      setFeedback({ ...feedback, show: false });
      // Reset feedback state after animation completes
      setTimeout(() => {
        setFeedback(null);
      }, 300);
    }
  };

  return (
    <FeedbackContext.Provider value={{ showFeedback, hideFeedback }}>
      {children}
      {feedback && (
        <FeedbackAnimation
          type={feedback.type}
          message={feedback.message}
          duration={feedback.duration}
          show={feedback.show}
          persistent={feedback.persistent}
          onComplete={() => setFeedback(null)}
        />
      )}
    </FeedbackContext.Provider>
  );
};
