/**
 * Script to set up Stripe products and prices for PDFSpark subscription plans
 * Run with: node scripts/setup-stripe-products.js
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const plans = [
  {
    name: 'Standard Plan',
    description: 'For individuals who need regular document conversion',
    id: 'standard',
    price: 999, // $9.99 in cents
    interval: 'month',
    features: [
      '50 conversions per month',
      'Files up to 20MB',
      'High conversion quality',
      'Priority support',
      'Access to all formats',
      'No watermarks'
    ]
  },
  {
    name: 'Premium Plan',
    description: 'For professionals with high-volume conversion needs',
    id: 'premium',
    price: 1999, // $19.99 in cents
    interval: 'month',
    features: [
      'Unlimited conversions',
      'Files up to 50MB',
      'Highest conversion quality',
      'Priority support',
      'Batch processing',
      'API access',
      'Advanced formatting options'
    ]
  },
  {
    name: 'Enterprise Plan',
    description: 'For businesses requiring custom solutions',
    id: 'enterprise',
    price: 4999, // $49.99 in cents
    interval: 'month',
    features: [
      'Unlimited conversions',
      'Files up to 200MB',
      'Highest conversion quality',
      'Dedicated support',
      'Advanced API access',
      'Custom integration options',
      'Team management features',
      'Advanced security features'
    ]
  }
];

async function createProductsAndPrices() {
  console.log('Setting up Stripe products and prices...');

  const results = {
    products: [],
    prices: []
  };

  for (const plan of plans) {
    try {
      // Create or retrieve product
      const existingProducts = await stripe.products.list({
        active: true,
        limit: 100
      });
      
      let product = existingProducts.data.find(p => p.name === plan.name);
      
      if (!product) {
        console.log(`Creating product: ${plan.name}`);
        product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          metadata: {
            plan_id: plan.id
          }
        });
        console.log(`Created product: ${product.id}`);
      } else {
        console.log(`Product already exists: ${product.id}`);
      }
      
      results.products.push(product);

      // Create or retrieve price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100
      });
      
      let price = existingPrices.data.find(p => 
        p.unit_amount === plan.price && 
        p.recurring && 
        p.recurring.interval === plan.interval
      );
      
      if (!price) {
        console.log(`Creating price for product: ${product.id}, amount: ${plan.price}`);
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.price,
          currency: 'usd',
          recurring: {
            interval: plan.interval
          },
          metadata: {
            plan_id: plan.id
          }
        });
        console.log(`Created price: ${price.id}`);
      } else {
        console.log(`Price already exists: ${price.id}`);
      }
      
      results.prices.push(price);
      
      console.log(`Setup completed for plan: ${plan.name}`);
      console.log(`STRIPE_${plan.id.toUpperCase()}_PRICE_ID=${price.id}`);
      console.log('-----------------------------');
    } catch (error) {
      console.error(`Error setting up ${plan.name}:`, error);
    }
  }

  console.log('\nSetup complete!');
  console.log('\nAdd these values to your .env file:');
  
  const priceMap = {};
  for (const price of results.prices) {
    const planId = price.metadata.plan_id.toUpperCase();
    priceMap[planId] = price.id;
  }
  
  console.log(`STRIPE_STANDARD_PRICE_ID=${priceMap.STANDARD || 'NOT_CREATED'}`);
  console.log(`STRIPE_PREMIUM_PRICE_ID=${priceMap.PREMIUM || 'NOT_CREATED'}`);
  console.log(`STRIPE_ENTERPRISE_PRICE_ID=${priceMap.ENTERPRISE || 'NOT_CREATED'}`);
}

createProductsAndPrices().catch(error => {
  console.error('Error in setup script:', error);
});