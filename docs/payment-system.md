# PDFSpark Payment System Documentation

This document outlines the payment system integration for PDFSpark, providing details on the architecture, workflow, and implementation.

## Overview

PDFSpark uses a one-time payment model for conversions. Users can convert documents (PDF to DOCX, DOCX to PDF) and need to make a one-time payment to download the converted file. The payment system is implemented using Stripe as the payment processor.

## Architecture

The payment system consists of two main components:

1. **Backend Payment Service**: A microservice responsible for payment processing, Stripe integration, and payment status tracking.
2. **Frontend Integration**: Components and stores that handle the payment flow from the user perspective.

## Key Components

### Backend

- **Payment Model**: Stores payment records with fields for status, amount, Stripe IDs, and conversion ID.
- **Stripe Service**: Handles direct interaction with Stripe API.
- **Payment Service**: Provides business logic for payment operations.
- **Webhook Handler**: Processes Stripe webhook events to update payment status.
- **API Endpoints**: REST endpoints for payment operations.

### Frontend

- **Payment Store**: State management for payments using Zustand.
- **Payment Button**: UI component to initiate payment flow.
- **Payment Required Download**: Higher-level component that shows payment or download button based on payment status.
- **Checkout Success Page**: Page shown after successful payment.
- **Account Page**: Displays payment history.

## Payment Flow

1. **Conversion Creation**:
   - User uploads a file for conversion
   - System processes the conversion
   - Conversion is ready but locked behind payment

2. **Payment Initiation**:
   - User clicks "Pay to Download" button
   - Frontend creates checkout session via API
   - User is redirected to Stripe Checkout page

3. **Payment Processing**:
   - User completes payment on Stripe Checkout
   - Stripe sends webhook events to our backend
   - Backend updates payment status

4. **Conversion Download**:
   - User is redirected back to application
   - Payment status is verified
   - Download is enabled for completed payments

## API Endpoints

### Payment Service

- `POST /payments/checkout` - Create a checkout session
- `GET /payments/status/:conversionId` - Get payment status for a conversion
- `GET /payments/history` - Get user's payment history
- `GET /payments/product-info` - Get product information (price, etc.)
- `POST /webhooks/stripe` - Webhook endpoint for Stripe events

## Webhook Events

The following Stripe events are handled:

- `checkout.session.completed` - When checkout is completed
- `payment_intent.succeeded` - When payment succeeds
- `payment_intent.payment_failed` - When payment fails

## Database Schema

```
Payment {
  userId: ObjectId
  stripeCustomerId: String (optional)
  stripePaymentIntentId: String
  stripeSessionId: String (optional)
  amount: Number
  currency: String
  status: Enum ['pending', 'completed', 'failed', 'refunded']
  conversionId: String (optional)
  metadata: Object (optional)
  createdAt: Date
  updatedAt: Date
}
```

## Configuration

The payment system requires the following environment variables:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_ID=prod_S0VrTQ8Byk5rBh
STRIPE_PRICE_ID=price_1R6UpLDGuTzqKXNWdVxYbRq4
```

## Frontend Components

### PaymentButton

A button component that initiates the payment flow for a conversion:

```jsx
<PaymentButton 
  conversionId="123" 
  onPaymentCompleted={() => downloadFile()} 
  showPrice={true} 
/>
```

### PaymentRequiredDownload

A higher-level component that shows either a payment button or download button depending on payment status:

```jsx
<PaymentRequiredDownload
  conversionId="123"
  onDownload={() => downloadFile()}
/>
```

## State Management

The frontend uses Zustand for state management with the following stores:

- `usePaymentStore` - Manages payment-related state and actions

## Testing

To test the payment flow:

1. Use Stripe test cards (e.g., 4242 4242 4242 4242)
2. Test webhook events using Stripe CLI
3. Verify payment status updates correctly

## Security Considerations

- All payment routes require authentication
- Webhook endpoints verify Stripe signature
- Payment verification before allowing downloads

## Future Improvements

- Refund processing
- Payment analytics and reporting
- Discount codes and promotions
- Subscription options for high-volume users