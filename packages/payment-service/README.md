# PDFSpark Payment Service

This microservice handles payment processing and subscription management for the PDFSpark application using Stripe.

## Features

- 💵 Complete Stripe integration for subscription-based billing
- 🔄 Subscription management (create, update, cancel)
- 🪝 Webhook handling for payment events
- 🔒 Secure customer data management
- 📊 Payment history tracking
- 📱 Stripe Customer Portal integration

## Setup and Configuration

### Prerequisites

- Node.js (v16+)
- MongoDB
- Stripe account (free to create)

### Environment Setup

1. Copy the `.env.example` file to `.env`:
   ```
   cp .env.example .env
   ```

2. Update the environment variables in `.env`:
   ```
   NODE_ENV=development
   PAYMENT_SERVICE_PORT=5002
   MONGODB_URI=mongodb://localhost:27017/payment-service
   API_URL=http://localhost:5000/api
   FRONTEND_URL=http://localhost:3000

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   STRIPE_STANDARD_PRICE_ID=price_standard
   STRIPE_PREMIUM_PRICE_ID=price_premium
   STRIPE_ENTERPRISE_PRICE_ID=price_enterprise
   ```

3. Initialize Stripe products and prices:
   ```
   node scripts/setup-stripe-products.js
   ```

4. Set up Stripe webhooks (for local development, use ngrok):
   ```
   # In a separate terminal
   ngrok http 5002

   # Then run the webhook setup script with your ngrok URL
   WEBHOOK_URL=https://your-ngrok-url.ngrok.io/payments/webhook node scripts/setup-stripe-webhook.js
   ```

## Running the Service

### Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Production

```bash
# Build the service
npm run build

# Start in production mode
npm start
```

## API Endpoints

### Payment Endpoints

- `POST /payments/create-checkout` - Create a checkout session
- `GET /payments/subscription` - Get current user subscription
- `POST /payments/cancel-subscription` - Cancel subscription
- `GET /payments/history` - Get payment history
- `POST /payments/create-portal-session` - Create Stripe customer portal session

### Webhook Endpoints

- `POST /payments/webhook` - Handle Stripe webhook events

## Webhook Events

The service handles the following Stripe webhook events:

- `customer.subscription.created` - When a subscription is created
- `customer.subscription.updated` - When a subscription is updated
- `customer.subscription.deleted` - When a subscription is canceled
- `invoice.payment_succeeded` - When a payment succeeds
- `invoice.payment_failed` - When a payment fails
- `checkout.session.completed` - When a checkout session is completed

## Subscription Tiers

The service supports the following subscription tiers:

1. **Standard Plan** - $9.99/month
   - 50 conversions per month
   - Files up to 20MB
   - High conversion quality
   - Priority support

2. **Premium Plan** - $19.99/month
   - Unlimited conversions
   - Files up to 50MB
   - Highest conversion quality
   - API access and batch processing

3. **Enterprise Plan** - $49.99/month
   - Unlimited conversions
   - Files up to 200MB
   - Dedicated support
   - Advanced integration options

## Architecture

The payment service is built as a microservice and follows a modular architecture:

- **Controllers**: Handle API requests and responses
- **Services**: Implement business logic and Stripe integration
- **Models**: Define data schemas for MongoDB
- **Routes**: Define API routes and endpoints
- **Middleware**: Handle authentication, validation, etc.
- **Utils**: Utility functions and helpers

## Frontend Integration

The frontend integration is implemented in the frontend package and includes:

- Subscription management UI
- Checkout flow with Stripe Checkout
- Subscription details display
- Payment history viewing
- Stripe Customer Portal integration

See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for detailed frontend integration instructions.

## Testing

To run tests:

```bash
npm test
```

## License

This project is proprietary and confidential.

## Contributing

Please see the main repository README for contribution guidelines.