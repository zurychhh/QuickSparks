import { useMemo } from 'react';
import abTestingManager, { 
  Variant, 
  EXPERIMENTS 
} from '../utils/ab-testing';

/**
 * Hook for using A/B testing in components
 * 
 * @param experimentId - ID of the experiment to use
 * @returns Object with variant info and helper functions
 */
export function useABTesting(experimentId: string) {
  const experimentData = useMemo(() => {
    const variant = abTestingManager.getVariant(experimentId);
    
    return {
      variant,
      isControl: variant === 'control',
      isVariantA: variant === 'A',
      isVariantB: variant === 'B',
      isVariantC: variant === 'C',
      isVariantD: variant === 'D',
      isVariant: (variantToCheck: Variant) => variant === variantToCheck,
      recordResult: (action: string, value?: number) => {
        abTestingManager.recordResult(experimentId, action, value);
      },
      experimentStatus: abTestingManager.getExperimentStatus(experimentId)
    };
  }, [experimentId]);
  
  return experimentData;
}

// Add constants for common experiments
useABTesting.EXPERIMENTS = EXPERIMENTS;

export default useABTesting;