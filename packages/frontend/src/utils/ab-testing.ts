import { trackEvent } from './analytics';

// Experiment variant type
export type Variant = 'A' | 'B' | 'C' | 'D' | 'control';

// Experiment interface
export interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  weights?: number[];
  isActive: boolean;
}

// User assignment interface
export interface UserAssignment {
  experimentId: string;
  variant: Variant;
  timestamp: number;
}

// ExperimentResult interface
export interface ExperimentResult {
  experimentId: string;
  variant: Variant;
  action: string;
  value?: number;
  timestamp: number;
}

/**
 * A/B Testing Manager
 */
class ABTestingManager {
  private experiments: Record<string, Experiment> = {};
  private userAssignments: UserAssignment[] = [];
  private experimentResults: ExperimentResult[] = [];
  private storageKey = 'pdfspark_experiments';
  
  constructor() {
    this.loadUserAssignments();
  }
  
  /**
   * Load user assignments from localStorage
   */
  private loadUserAssignments(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        this.userAssignments = JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Failed to load A/B testing data:', error);
      this.userAssignments = [];
    }
  }
  
  /**
   * Save user assignments to localStorage
   */
  private saveUserAssignments(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.userAssignments));
    } catch (error) {
      console.error('Failed to save A/B testing data:', error);
    }
  }
  
  /**
   * Register an experiment
   */
  public registerExperiment(experiment: Experiment): void {
    this.experiments[experiment.id] = experiment;
    console.log(`Registered experiment: ${experiment.name} (ID: ${experiment.id})`);
  }
  
  /**
   * Register multiple experiments
   */
  public registerExperiments(experiments: Experiment[]): void {
    experiments.forEach(experiment => this.registerExperiment(experiment));
  }
  
  /**
   * Get a random variant based on weights
   */
  private getRandomVariant(variants: Variant[], weights?: number[]): Variant {
    // If weights are not provided, use equal distribution
    if (!weights || weights.length !== variants.length) {
      weights = variants.map(() => 1 / variants.length);
    }
    
    // Normalize weights to ensure they sum to 1
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    const normalizedWeights = weights.map(weight => weight / totalWeight);
    
    // Generate a random number between 0 and 1
    const random = Math.random();
    
    // Find the variant based on the random number and weights
    let cumulativeWeight = 0;
    for (let i = 0; i < variants.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (random <= cumulativeWeight) {
        return variants[i];
      }
    }
    
    // Fallback to the first variant
    return variants[0];
  }
  
  /**
   * Get assigned variant for a user
   */
  public getVariant(experimentId: string): Variant | null {
    // Check if experiment exists and is active
    const experiment = this.experiments[experimentId];
    if (!experiment || !experiment.isActive) {
      return null;
    }
    
    // Check if user is already assigned to this experiment
    const existingAssignment = this.userAssignments.find(
      assignment => assignment.experimentId === experimentId
    );
    
    if (existingAssignment) {
      return existingAssignment.variant;
    }
    
    // Assign user to a variant
    const variant = this.getRandomVariant(experiment.variants, experiment.weights);
    
    // Save the assignment
    const assignment: UserAssignment = {
      experimentId,
      variant,
      timestamp: Date.now()
    };
    
    this.userAssignments.push(assignment);
    this.saveUserAssignments();
    
    // Track the assignment in analytics
    trackEvent({
      category: 'Experiment',
      action: 'Assignment',
      label: `${experimentId}:${variant}`
    });
    
    return variant;
  }
  
  /**
   * Check if a specific variant is active for the user
   */
  public isVariant(experimentId: string, variant: Variant): boolean {
    const assignedVariant = this.getVariant(experimentId);
    return assignedVariant === variant;
  }
  
  /**
   * Record an experiment result
   */
  public recordResult(
    experimentId: string,
    action: string,
    value?: number
  ): void {
    // Get the user's variant
    const variant = this.getVariant(experimentId);
    if (!variant) return;
    
    // Record the result
    const result: ExperimentResult = {
      experimentId,
      variant,
      action,
      value,
      timestamp: Date.now()
    };
    
    this.experimentResults.push(result);
    
    // Track the result in analytics
    trackEvent({
      category: 'Experiment',
      action: `${experimentId}_${action}`,
      label: variant,
      value
    });
  }
  
  /**
   * Clear all user assignments (usually for testing)
   */
  public clearAssignments(): void {
    this.userAssignments = [];
    this.saveUserAssignments();
  }
  
  /**
   * Get experiment status
   */
  public getExperimentStatus(experimentId: string): {
    isActive: boolean;
    variant: Variant | null;
    experimentName: string | null;
  } {
    const experiment = this.experiments[experimentId];
    if (!experiment) {
      return { isActive: false, variant: null, experimentName: null };
    }
    
    return {
      isActive: experiment.isActive,
      variant: this.getVariant(experimentId),
      experimentName: experiment.name
    };
  }
}

// Create singleton instance
export const abTestingManager = new ABTestingManager();

// Example experiments
export const EXPERIMENTS = {
  PRICING_PAGE_LAYOUT: 'pricing_page_layout',
  CHECKOUT_FLOW: 'checkout_flow',
  LANDING_PAGE_CTA: 'landing_page_cta',
  CONVERSION_OPTIONS: 'conversion_options'
};

export default abTestingManager;