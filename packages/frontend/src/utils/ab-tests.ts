import abTestingManager from './ab-testing';

/**
 * Register all A/B tests for the application
 */
export function registerABTests() {
  // Define experiment IDs
  const EXPERIMENTS = {
    PRICING_PAGE_LAYOUT: 'pricing_page_layout',
    CHECKOUT_FLOW: 'checkout_flow',
    LANDING_PAGE_CTA: 'landing_page_cta',
    CONVERSION_OPTIONS: 'conversion_options'
  };
  
  // Pricing Page Layout Test
  abTestingManager.registerExperiment({
    id: EXPERIMENTS.PRICING_PAGE_LAYOUT,
    name: 'Pricing Page Layout Variations',
    variants: ['control', 'A', 'B'],
    weights: [0.34, 0.33, 0.33], // Control gets slightly more traffic
    isActive: true
  });
  
  // Checkout Flow Test
  abTestingManager.registerExperiment({
    id: EXPERIMENTS.CHECKOUT_FLOW,
    name: 'Checkout Flow Optimization',
    variants: ['control', 'A'],
    weights: [0.5, 0.5],
    isActive: true
  });
  
  // Landing Page CTA Test
  abTestingManager.registerExperiment({
    id: EXPERIMENTS.LANDING_PAGE_CTA,
    name: 'Landing Page Call-to-Action',
    variants: ['control', 'A', 'B', 'C'],
    weights: [0.25, 0.25, 0.25, 0.25],
    isActive: true
  });
  
  // Conversion Options Test
  abTestingManager.registerExperiment({
    id: EXPERIMENTS.CONVERSION_OPTIONS,
    name: 'Conversion Options Layout',
    variants: ['control', 'A'],
    weights: [0.5, 0.5],
    isActive: true
  });
  
  console.log('A/B tests registered successfully');
}

export default registerABTests;