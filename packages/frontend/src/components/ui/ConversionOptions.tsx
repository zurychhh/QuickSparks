import React, { useState, useCallback, useMemo, memo } from 'react';
import { cn } from '../../utils/classnames';
import { useFeedback } from '../../context/FeedbackContext';
import debounce from 'lodash.debounce'; // Add this as a dependency

export interface ConversionOptionProps {
  conversionType: 'pdf-to-docx' | 'docx-to-pdf';
  quality: 'standard' | 'high';
  preserveFormatting: boolean;
  onOptionChange: (name: string, value: string | boolean) => void;
  disabled?: boolean;
  className?: string;
}

// Option card component - extract for memoization
const OptionCard = memo(
  ({
    selected,
    animating,
    disabled,
    onClick,
    label,
    description,
    checkType = 'radio',
  }: {
    selected: boolean;
    animating: boolean;
    disabled: boolean;
    onClick: () => void;
    label: string;
    description: string;
    checkType?: 'radio' | 'checkbox';
  }) => {
    return (
      <div
        className={cn(
          'border rounded-lg p-3 sm:p-4 cursor-pointer transition-all duration-200',
          selected
            ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
            : 'border-gray-200 hover:border-gray-300 hover:shadow',
          animating && 'scale-[1.02] shadow-md will-change-transform',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
        onClick={onClick}
      >
        <div className="flex items-start">
          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center mr-3 mt-0.5',
              checkType === 'radio' ? 'w-5 h-5 rounded-full border' : 'w-5 h-5 rounded border',
              selected ? 'border-primary-500' : 'border-gray-300',
              checkType === 'checkbox' && selected && 'bg-primary-500',
            )}
          >
            {selected && checkType === 'radio' && (
              <div className="w-3 h-3 rounded-full bg-primary-500" />
            )}
            {selected && checkType === 'checkbox' && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 
              011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm sm:text-base font-medium text-gray-900">{label}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </div>
    );
  },
);

OptionCard.displayName = 'OptionCard';

// Main component with optimization
const ConversionOptions: React.FC<ConversionOptionProps> = memo(
  ({
    conversionType,
    quality,
    preserveFormatting,
    onOptionChange,
    disabled = false,
    className,
  }) => {
    const [animateOption, setAnimateOption] = useState<string | null>(null);
    const { showFeedback } = useFeedback();

    // Debounced animation reset to reduce performance impact
    const resetAnimation = useCallback(
      debounce(() => setAnimateOption(null), 500),
      [],
    );

    // Handle option change with animation and feedback - optimized with useCallback
    const handleOptionChange = useCallback(
      (name: string, value: string | boolean) => {
        if (disabled) return;

        // Set animation
        setAnimateOption(`${name}-${value}`);
        resetAnimation();

        // Show feedback based on option changed
        if (name === 'quality') {
          showFeedback(
            'info',
            value === 'high'
              ? 'High quality selected - Better formatting preservation'
              : 'Standard quality selected - Faster conversion',
            2000,
          );
        } else if (name === 'preserveFormatting') {
          showFeedback(
            'info',
            value ? 'Formatting will be preserved' : 'Basic formatting selected for simpler output',
            2000,
          );
        }

        // Call original handler
        onOptionChange(name, value);
      },
      [disabled, resetAnimation, showFeedback, onOptionChange],
    );

    // Memoized option handlers to maintain referential equality
    const highQualityHandler = useCallback(
      () => handleOptionChange('quality', 'high'),
      [handleOptionChange],
    );

    const standardQualityHandler = useCallback(
      () => handleOptionChange('quality', 'standard'),
      [handleOptionChange],
    );

    const preserveFormattingHandler = useCallback(
      () => handleOptionChange('preserveFormatting', !preserveFormatting),
      [handleOptionChange, preserveFormatting],
    );

    // Memoize the hint text since it only depends on conversionType
    const hintText = useMemo(() => {
      return conversionType === 'pdf-to-docx'
        ? 'Advanced formatting may affect conversion time. High quality is recommended for complex layouts.'
        : 'For best results when converting to PDF, use high quality for documents with images or complex formatting';
    }, [conversionType]);

    // Memoize the formatting description since it only depends on conversionType
    const formattingDescription = useMemo(() => {
      return conversionType === 'pdf-to-docx'
        ? 'Keep fonts, layout, tables and styles as close to original as possible'
        : 'Keep document styling and layout in the PDF output';
    }, [conversionType]);

    return (
      <div className={cn('space-y-4 sm:space-y-6', className)}>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Quality Options</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
            <OptionCard
              selected={quality === 'high'}
              animating={animateOption === 'quality-high'}
              disabled={disabled}
              onClick={highQualityHandler}
              label="High Quality"
              description="Best formatting and appearance preservation"
              checkType="radio"
            />

            <OptionCard
              selected={quality === 'standard'}
              animating={animateOption === 'quality-standard'}
              disabled={disabled}
              onClick={standardQualityHandler}
              label="Standard"
              description="Faster conversion with good quality"
              checkType="radio"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Format Settings</h3>
          <OptionCard
            selected={preserveFormatting}
            animating={animateOption === `preserveFormatting-${!preserveFormatting}`}
            disabled={disabled}
            onClick={preserveFormattingHandler}
            label="Preserve formatting"
            description={formattingDescription}
            checkType="checkbox"
          />
        </div>

        <div className="pt-2">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-primary-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 
              001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-gray-500 leading-tight sm:leading-normal">{hintText}</p>
          </div>
        </div>
      </div>
    );
  },
);

ConversionOptions.displayName = 'ConversionOptions';

export default ConversionOptions;
