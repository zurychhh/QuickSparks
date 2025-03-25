/**
 * Script to set up Stripe webhook endpoints for PDFSpark
 * Run with: node scripts/setup-stripe-webhook.js
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// The URL where your webhook endpoint is hosted
// For local development, use a tool like ngrok to expose your local server
const webhookUrl = process.env.WEBHOOK_URL || 'https://your-website.com/api/payments/webhook';

async function createWebhook() {
  console.log('Setting up Stripe webhook...');
  
  try {
    // List existing webhooks to avoid duplicates
    const webhooks = await stripe.webhookEndpoints.list();
    
    const existingWebhook = webhooks.data.find(webhook => 
      webhook.url === webhookUrl
    );
    
    if (existingWebhook) {
      console.log(`Webhook already exists for URL: ${webhookUrl}`);
      console.log(`Webhook ID: ${existingWebhook.id}`);
      console.log(`Webhook Secret: [REDACTED] - find this in your Stripe dashboard`);
      return;
    }
    
    // Create webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'checkout.session.completed',
        'customer.created',
        'customer.updated',
        'payment_intent.succeeded',
        'payment_intent.payment_failed'
      ],
      description: 'PDFSpark subscription webhook'
    });
    
    console.log(`Successfully created webhook endpoint: ${webhook.id}`);
    console.log(`Webhook URL: ${webhook.url}`);
    console.log(`Webhook Secret: ${webhook.secret}`);
    console.log('\nIMPORTANT: Add this webhook secret to your .env file:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
    
  } catch (error) {
    console.error('Error creating webhook:', error);
  }
}

createWebhook().catch(error => {
  console.error('Error in setup script:', error);
});