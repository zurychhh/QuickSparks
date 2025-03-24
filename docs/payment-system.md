# QuickSparks Payment System Design

This document outlines the design for the simplified payment system to be implemented in the QuickSparks MVP, focusing on integration with PayByLink.

## Overview

The payment system will provide a secure and streamlined way for users to pay for conversion services, supporting both one-time payments and subscription models. The implementation prioritizes simplicity and security while establishing a foundation for future enhancements.

## Architecture

The payment system follows a simple flow:

1. **Service Selection**: User selects a service or subscription plan
2. **Checkout Process**: User provides minimal required information
3. **Payment Processing**: Integration with PayByLink for actual payment processing
4. **Payment Verification**: Confirmation of successful payment
5. **Service Activation**: Enabling access to paid features

![Payment System Architecture](https://via.placeholder.com/800x400?text=QuickSparks+Payment+System)

## Integration with PayByLink

PayByLink will be used as the primary payment processor for the MVP, offering:

- Support for major payment methods (credit cards, bank transfers)
- Compliance with security standards
- Simple API integration
- Support for Polish and international payments

### Integration Components

1. **Server-Side Integration**:
   - API client for creating payment requests
   - Webhook handling for payment notifications
   - Secure storage of transaction records

2. **Client-Side Components**:
   - Checkout form with minimal data collection
   - Redirect to PayByLink payment page
   - Success/failure handling
   - Payment status display

## Payment Flow

```
┌──────────┐     ┌──────────┐     ┌───────────┐     ┌────────────┐
│  Client  │────▶│  Server  │────▶│ PayByLink │────▶│  Callback  │
└──────────┘     └──────────┘     └───────────┘     └────────────┘
      │                                                    │
      │                                                    │
      └────────────────────────────────────────────────────┘
                          Redirect
```

1. **Payment Initiation**:
   - User selects service or plan
   - Backend creates a payment request with PayByLink
   - User is redirected to PayByLink payment page

2. **Payment Processing**:
   - User completes payment on PayByLink
   - PayByLink processes the payment
   - PayByLink redirects user back to our application

3. **Payment Verification**:
   - PayByLink sends webhook notification to our server
   - Server verifies payment status
   - Server updates subscription/service status
   - User is shown confirmation or error message

## Payment Models

The system will support two payment models:

### One-Time Payments

- Pay per conversion or batch of conversions
- Simple pricing structure based on file type and size
- Access to converted files for a limited time period

### Subscription Plans

- Monthly recurring payments
- Tiered pricing with different feature sets
- Usage quotas with clear limits

## Data Model

**Key entities relevant to payments:**

1. **PaymentIntent**:
   ```javascript
   {
     _id: ObjectId,                // MongoDB auto-generated ID
     userId: ObjectId,             // Reference to User
     amount: Number,               // Payment amount
     currency: String,             // Currency code (PLN, EUR, USD)
     description: String,          // Payment description
     status: String,               // Status (created, pending, completed, failed)
     paymentMethod: String,        // Payment method chosen
     payByLinkId: String,          // PayByLink payment ID
     payByLinkUrl: String,         // PayByLink payment URL
     successUrl: String,           // Redirect URL on success
     cancelUrl: String,            // Redirect URL on cancel
     metadata: Object,             // Additional payment metadata
     createdAt: Date,              // Creation timestamp
     expiresAt: Date               // Expiration timestamp
   }
   ```

2. **Transaction**:
   ```javascript
   {
     _id: ObjectId,                // MongoDB auto-generated ID
     userId: ObjectId,             // Reference to User
     paymentIntentId: ObjectId,    // Reference to PaymentIntent
     subscriptionId: ObjectId,     // Reference to Subscription (if applicable)
     amount: Number,               // Transaction amount
     currency: String,             // Currency code
     status: String,               // Status (completed, refunded, failed)
     payByLinkTransactionId: String,// External transaction ID
     paymentMethod: String,        // Method used (card, transfer)
     paymentDetails: Object,       // Details from payment provider
     createdAt: Date,              // Creation timestamp
     completedAt: Date,            // Completion timestamp
     receiptUrl: String            // URL to receipt
   }
   ```

## Security Considerations

1. **Data Protection**:
   - No storage of payment card details on our servers
   - All sensitive data handled directly by PayByLink
   - Secure handling of API keys and credentials

2. **Transaction Verification**:
   - Verification of payment notifications using signatures
   - Idempotent processing to prevent duplicate transactions
   - Logging of all payment events for audit purposes

3. **Compliance**:
   - GDPR compliance for user data
   - VAT handling for EU transactions
   - Clear terms and conditions for payments

## Error Handling

The payment system includes robust error handling:

1. **Payment Failures**:
   - Clear error messages for users
   - Automatic notification of system administrators
   - Recovery paths for common errors

2. **Communication Failures**:
   - Retry mechanisms for webhook delivery
   - Regular reconciliation with PayByLink
   - Manual intervention process for unresolved issues

3. **User Experience**:
   - Graceful handling of browser navigation/refreshes
   - Clear status indications throughout the payment process
   - Support contact information for payment issues

## Implementation Plan

The implementation will focus on essential features for the MVP:

1. **Phase 1 (MVP)**:
   - Basic PayByLink integration for one-time payments
   - Simple pricing model
   - Manual handling of edge cases
   - Basic receipt generation

2. **Future Enhancements**:
   - Subscription management with automatic renewals
   - Multiple payment providers
   - Advanced analytics and reporting
   - Promotional codes and discounts
   - Invoicing and tax handling

## Testing Strategy

1. **Integration Testing**:
   - Automated tests for PayByLink integration
   - Webhook processing verification
   - Error condition handling

2. **End-to-End Testing**:
   - Complete payment flow testing in sandbox environment
   - Testing of success and failure scenarios
   - Mobile and desktop browser testing

3. **Security Testing**:
   - Penetration testing of payment-related endpoints
   - Verification of data protection measures
   - Testing of access controls

## Monitoring and Operations

1. **Payment Monitoring**:
   - Real-time dashboard for payment status
   - Alerting for payment failures
   - Daily reconciliation with PayByLink

2. **Reporting**:
   - Daily sales reports
   - Payment method distribution
   - Conversion rates from checkout to payment completion

## Code Structure

The payment system will be implemented as a separate module with clear boundaries:

```
payment/
├── controllers/         # Request handlers
│   ├── checkout.js      # Checkout process
│   ├── webhook.js       # Webhook handling
│   └── receipts.js      # Receipt generation
├── services/            # Business logic
│   ├── payByLink.js     # PayByLink API client
│   ├── subscription.js  # Subscription management
│   └── transaction.js   # Transaction handling
├── models/              # Data models
│   ├── paymentIntent.js # Payment intent model
│   └── transaction.js   # Transaction model
├── utils/               # Utilities
│   ├── security.js      # Security utilities
│   └── validation.js    # Validation logic
└── config.js            # Payment configuration
```

## Conclusion

This simplified payment system design provides a secure and effective way to monetize the QuickSparks application while establishing a foundation for future enhancements. By focusing on essential functionality and leveraging PayByLink's secure payment processing, we can quickly implement a payment solution that meets the needs of the MVP while maintaining high security standards.