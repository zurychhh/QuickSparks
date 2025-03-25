import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { cn } from '../../utils/classnames';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface FeedbackAnimationProps {
  type: FeedbackType;
  message: string;
  duration?: number;
  className?: string;
  onComplete?: () => void;
  show?: boolean;
  icon?: React.ReactNode;
  persistent?: boolean;
}

// Moved outside component to prevent recreation on every render
const DEFAULT_ICONS = {
  success: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  loading: (
    <svg
      className="w-6 h-6 animate-spin will-change-transform"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  ),
};

// Moved outside component to prevent recreation on every render
const ANIMATION_CLASSES = {
  enter: 'transition-all duration-300 ease-out transform will-change-transform',
  enterFrom: 'opacity-0 scale-95 translate-y-2',
  enterTo: 'opacity-100 scale-100 translate-y-0',
  leave: 'transition-all duration-200 ease-in transform will-change-transform',
  leaveFrom: 'opacity-100 scale-100 translate-y-0',
  leaveTo: 'opacity-0 scale-95 translate-y-2',
};

// Moved outside component to prevent recreation on every render
const TYPE_STYLES = {
  success: 'bg-green-100 border-green-500 text-green-800',
  error: 'bg-red-100 border-red-500 text-red-800',
  info: 'bg-blue-100 border-blue-500 text-blue-800',
  warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  loading: 'bg-blue-50 border-blue-400 text-blue-700',
};

// Moved outside component to prevent recreation on every render
const ICON_STYLES = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  loading: 'text-blue-500',
};

/**
 * Animated feedback component for success, error, info, warning and loading states
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const FeedbackAnimation: React.FC<FeedbackAnimationProps> = memo(
  ({
    type,
    message,
    duration = 3000,
    className,
    onComplete,
    show = true,
    icon,
    persistent = false,
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Determine icon based on type or custom icon - memoized to prevent recalculation
    const iconElement = useMemo(() => icon || DEFAULT_ICONS[type], [icon, type]);

    // Optimize close button handler with useCallback
    const handleClose = useCallback(() => {
      setIsVisible(false);
    }, []);

    // Effect to handle animation mounting and timing
    useEffect(() => {
      if (show) {
        setIsMounted(true);
        // Small delay to ensure mount happens before animation
        const mountTimer = setTimeout(() => {
          setIsVisible(true);
        }, 10);

        // Auto-hide after duration unless persistent
        let hideTimer: NodeJS.Timeout;
        if (!persistent && type !== 'loading') {
          hideTimer = setTimeout(() => {
            setIsVisible(false);
            // Small delay to allow exit animation to complete
            setTimeout(() => {
              setIsMounted(false);
              if (onComplete) onComplete();
            }, 300);
          }, duration);
        }

        return () => {
          clearTimeout(mountTimer);
          if (hideTimer) clearTimeout(hideTimer);
        };
      } else {
        setIsVisible(false);
        // Small delay to allow exit animation to complete
        const unmountTimer = setTimeout(() => {
          setIsMounted(false);
          if (onComplete) onComplete();
        }, 300);

        return () => {
          clearTimeout(unmountTimer);
        };
      }
    }, [show, duration, onComplete, persistent, type]);

    if (!isMounted) return null;

    return (
      <div
        className={cn(
          'fixed flex items-center p-4 mb-4 border-l-4 rounded-lg shadow-md z-50',
          TYPE_STYLES[type],
          ANIMATION_CLASSES.enter,
          isVisible ? ANIMATION_CLASSES.enterTo : ANIMATION_CLASSES.enterFrom,
          isVisible ? '' : ANIMATION_CLASSES.leave,
          isVisible ? '' : ANIMATION_CLASSES.leaveTo,
          className,
        )}
        style={{
          top: '1rem',
          right: '1rem',
          maxWidth: '24rem',
          willChange: 'transform, opacity', // Optimize animations with willChange
        }}
      >
        <div className={cn('flex-shrink-0 mr-3', ICON_STYLES[type])}>{iconElement}</div>
        <div className="text-sm font-medium">{message}</div>
        {persistent && type !== 'loading' && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 bg-transparent inline-flex items-center justify-center w-6 h-6 p-1 
          rounded-md focus:outline-none"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

// Add display name for debugging
FeedbackAnimation.displayName = 'FeedbackAnimation';

export default FeedbackAnimation;
