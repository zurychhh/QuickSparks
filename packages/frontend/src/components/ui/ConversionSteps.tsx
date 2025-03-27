import React, { useEffect, useState, memo, useMemo } from 'react';
import { cn } from '../../utils/classnames';

export type ConversionStep = 'select' | 'upload' | 'convert' | 'download';

interface ConversionStepsProps {
  currentStep: ConversionStep;
  className?: string;
}

// Define steps outside component to prevent recreation on every render
const CONVERSION_STEPS: { id: ConversionStep; label: string; description: string }[] = [
  {
    id: 'select',
    label: 'Select File',
    description: 'Choose document type & upload',
  },
  {
    id: 'upload',
    label: 'Upload',
    description: 'Wait for upload to complete',
  },
  {
    id: 'convert',
    label: 'Convert',
    description: 'Process file conversion',
  },
  {
    id: 'download',
    label: 'Download',
    description: 'Get your converted file',
  },
];

// Optimized step indicator component
const StepIndicator = memo(
  ({
    step,
    index,
    isActive,
    isCompleted,
    animateStep,
  }: {
    step: (typeof CONVERSION_STEPS)[0];
    index: number;
    isActive: boolean;
    isCompleted: boolean;
    animateStep: string | null;
  }) => (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold mb-2',
          'transition-all duration-300 will-change-transform',
          isActive && 'border-primary-500 bg-primary-50 text-primary-600',
          isCompleted && 'border-primary-500 bg-primary-500 text-white',
          !isActive && !isCompleted && 'border-gray-300 text-gray-500',
          animateStep === step.id && 'scale-125 shadow animate-pulse',
        )}
      >
        {isCompleted ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 
            011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          index + 1
        )}
      </div>
      <div className="text-center">
        <p
          className={cn(
            'text-xs font-medium transition-all duration-300',
            isActive ? 'text-primary-600' : isCompleted ? 'text-primary-500' : 'text-gray-500',
            animateStep === step.id && 'font-bold scale-110',
          )}
        >
          {step.label}
        </p>
        <p className="text-xs text-gray-400 hidden md:block">{step.description}</p>
      </div>
    </div>
  ),
);

StepIndicator.displayName = 'StepIndicator';

// Optimized connector component
const StepConnector = memo(
  ({
    isCompleted,
    nextStepId,
    animateStep,
  }: {
    isCompleted: boolean;
    nextStepId?: ConversionStep;
    animateStep: string | null;
  }) => (
    <div className="w-full max-w-[100px] lg:max-w-none flex-grow mx-2 h-[2px] bg-gray-200 overflow-hidden">
      <div
        className={cn(
          'h-full bg-primary-500 transition-all duration-500',
          animateStep === nextStepId && 'animate-progress-pulse',
        )}
        style={{ width: isCompleted ? '100%' : '0%', willChange: 'width' }}
      />
    </div>
  ),
);

StepConnector.displayName = 'StepConnector';

// Optimized with memo to prevent unnecessary re-renders
const ConversionSteps: React.FC<ConversionStepsProps> = memo(({ currentStep, className }) => {
  const [animateStep, setAnimateStep] = useState<string | null>(null);
  const [prevStep, setPrevStep] = useState<ConversionStep>(currentStep);

  // Detect step changes and trigger animations
  useEffect(() => {
    if (currentStep !== prevStep) {
      setAnimateStep(currentStep);
      setPrevStep(currentStep);

      // Reset animation after it completes
      const timer = setTimeout(() => {
        setAnimateStep(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, prevStep]);

  // Find index of current step - memoized to prevent recalculation
  const currentIndex = useMemo(
    () => CONVERSION_STEPS.findIndex(step => step.id === currentStep),
    [currentStep],
  );

  // Memoize mobile step content to prevent unnecessary recalculation
  const mobileStepContent = useMemo(() => {
    const step = CONVERSION_STEPS[currentIndex];
    return {
      label: step?.label,
      description: step?.description,
    };
  }, [currentIndex]);

  // Memoize mobile progress width calculation
  const mobileProgressWidth = useMemo(
    () => `${(currentIndex / (CONVERSION_STEPS.length - 1)) * 100}%`,
    [currentIndex],
  );

  return (
    <div className={cn('mb-8', className)}>
      {/* Desktop view - only render when screen is large enough */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {CONVERSION_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <StepIndicator
                step={step}
                index={index}
                isActive={isActive}
                isCompleted={isCompleted}
                animateStep={animateStep}
              />

              {/* Connector line */}
              {index < CONVERSION_STEPS.length - 1 && (
                <StepConnector
                  isCompleted={isCompleted}
                  nextStepId={CONVERSION_STEPS[index + 1]?.id}
                  animateStep={animateStep}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile view - Only render when screen is small */}
      <div className="sm:hidden">
        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-primary-500 bg-primary-50 text-primary-600 text-sm font-semibold mr-3">
              {currentIndex + 1}
            </div>
            <div>
              <p className="text-sm font-medium text-primary-600">{mobileStepContent.label}</p>
              <p className="text-xs text-gray-500">{mobileStepContent.description}</p>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500">
            Step {currentIndex + 1} of {CONVERSION_STEPS.length}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: mobileProgressWidth, willChange: 'width' }}
          />
        </div>
      </div>
    </div>
  );
});

ConversionSteps.displayName = 'ConversionSteps';

export default ConversionSteps;
