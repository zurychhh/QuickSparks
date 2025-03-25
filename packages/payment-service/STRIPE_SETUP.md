# Stripe Integration Setup Guide

This guide will help you complete the setup of Stripe integration for PDFSpark's payment system.

## Prerequisites

- Stripe account (test or production)
- Node.js and npm installed
- MongoDB running locally or accessible remotely

## Step 1: Environment Configuration

The basic configuration is already set up in the `.env` file:

```
STRIPE_SECRET_KEY=sk_test_51R3DdCDGuTzqKXNWt1AI0RNLMHGLcEdoUm24Vk0cME1LfAYnkYgJaxaJx6BpDSWvPW7F3GC8nPwV154YoKsgd5Wi00TBOpfHbD
STRIPE_WEBHOOK_SECRET=whsec_test_create_this_in_stripe_dashboard
```

## Step 2: Create Stripe Products and Prices

Run the setup script to create the subscription products and prices in your Stripe account:

```bash
# Install stripe dependency first
npm install stripe

# Run the setup script
cd packages/payment-service
node scripts/setup-stripe-products.js
```

This script will:
1. Create the Standard, Premium, and Enterprise products in your Stripe account (if they don't exist)
2. Create the corresponding prices for each product
3. Output the price IDs to add to your `.env` file

Copy the price IDs from the output and update your `.env` file:

```
STRIPE_STANDARD_PRICE_ID=price_xyz123...
STRIPE_PREMIUM_PRICE_ID=price_abc456...
STRIPE_ENTERPRISE_PRICE_ID=price_def789...
```

## Step 3: Set Up Webhook Endpoint

For local development, you'll need to make your local server publicly accessible. You can use a tool like ngrok for this:

```bash
# Install ngrok if you haven't already
npm install -g ngrok

# Start your payment service
npm run start:payment-service

# In a new terminal, expose your payment service with ngrok
ngrok http 5002
```

Take the HTTPS URL from ngrok (e.g., `https://abcd1234.ngrok.io`) and set it in the `WEBHOOK_URL` environment variable before running the webhook setup script:

```bash
cd packages/payment-service
WEBHOOK_URL=https://your-ngrok-url.ngrok.io/payments/webhook node scripts/setup-stripe-webhook.js
```

This script will:
1. Create a webhook endpoint in your Stripe account
2. Configure it to listen for subscription-related events
3. Output the webhook secret to add to your `.env` file

Update your `.env` file with the webhook secret:

```
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

## Step 4: Testing the Integration

Now you can test the complete payment flow:

1. Start the frontend, backend services, and API gateway
2. Navigate to the Pricing page
3. Select a subscription plan
4. Complete the checkout process using Stripe's test card details:
   - Card number: `4242 4242 4242 4242`
   - Expiration: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

## Step 5: Verifying Webhooks

After completing a test subscription, you should:
1. Verify that the webhook events are being received by your payment service
2. Check that the subscription is correctly stored in your database
3. Confirm that the subscription status is reflected in the user interface

## Troubleshooting

If you encounter issues:

1. **Checkout Fails to Open:**
   - Check browser console for errors
   - Verify that the Stripe publishable key is correctly set in the frontend

2. **Webhook Events Not Received:**
   - Verify your webhook URL is accessible
   - Check the Stripe Dashboard > Developers > Webhooks > Events to see if events are being sent
   - Confirm the webhook secret matches in your `.env` file

3. **Subscription Not Updated:**
   - Check logs in your payment service for webhook processing errors
   - Verify that webhook signature verification is working correctly
   - Check the MongoDB database to ensure subscriptions are being created/updated

## Production Deployment

For production deployment:

1. Switch to production Stripe API keys
2. Update your webhook URL to point to your production environment
3. Ensure that your production environment variables are securely managed
4. Consider implementing additional security measures (rate limiting, IP restrictions)

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)