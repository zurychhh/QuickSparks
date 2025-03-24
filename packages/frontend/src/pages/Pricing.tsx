import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@components/ui/Button';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for occasional use and trying out the service.',
    features: [
      '3 conversions per day',
      'Files up to 5MB',
      'Standard conversion quality',
      'Basic support',
      'No credit card required',
    ],
    cta: 'Start Free',
  },
  {
    name: 'Standard',
    price: '$9.99',
    description: 'For individuals who need regular document conversion.',
    features: [
      '50 conversions per month',
      'Files up to 20MB',
      'High conversion quality',
      'Priority support',
      'Access to all formats',
      'No watermarks',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '$19.99',
    description: 'For professionals with high-volume conversion needs.',
    features: [
      'Unlimited conversions',
      'Files up to 50MB',
      'Highest conversion quality',
      'Priority support',
      'Batch processing',
      'API access',
      'Advanced formatting options',
    ],
    cta: 'Start Free Trial',
  },
];

const PricingPage: React.FC = (): React.ReactElement => {
  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-500">
            Choose the plan that fits your needs. All plans include high-quality document conversion.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map(tier => (
            <div 
              key={tier.name} 
              className={`bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${tier.highlighted ? 'border-2 border-primary-500 transform scale-105 z-10' : ''}`}
            >
              {tier.highlighted && (
                <div className="bg-primary-500 text-white text-center py-2 font-medium">
                  Most Popular
                </div>
              )}

              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">{tier.name}</h2>
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-900">{tier.price}</span>
                  <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                </div>
                <p className="text-gray-500">{tier.description}</p>

                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="px-6 pb-6">
                <Link to="/signup">
                  <Button 
                    variant={tier.highlighted ? 'primary' : 'outline'} 
                    size="lg" 
                    fullWidth
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-6 text-left">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Can I change my plan later?</h3>
              <p className="mt-2 text-base text-gray-500">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Do you offer refunds?</h3>
              <p className="mt-2 text-base text-gray-500">
                We offer a 14-day money-back guarantee if you're not satisfied with our service.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">What payment methods do you accept?</h3>
              <p className="mt-2 text-base text-gray-500">
                We accept all major credit cards, PayPal, and bank transfers for annual plans.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Do you offer custom enterprise plans?</h3>
              <p className="mt-2 text-base text-gray-500">
                Yes, we offer custom plans for businesses with specific needs. Contact our sales team for more information.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">How secure is my data?</h3>
              <p className="mt-2 text-base text-gray-500">
                Your files are encrypted during transit and at rest. We automatically delete all files after processing unless you specifically choose to save them.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto bg-primary-600 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-12 sm:p-12 text-center text-white">
            <h2 className="text-2xl font-bold sm:text-3xl">Need a custom solution?</h2>
            <p className="mt-4 text-lg">Contact our sales team to discuss your specific requirements.</p>
            <div className="mt-8">
              <Link to="/contact">
                <Button variant="outline" size="lg" className="bg-white text-primary-600 hover:bg-primary-50 border-white">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;