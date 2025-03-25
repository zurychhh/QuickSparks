# Payment System Integration Documentation

## Overview

The payment system integration allows the conversion service to charge users for document conversions. The system integrates with the PayByLink payment gateway to process payments securely. The implementation includes payment initiation, notification handling, and payment verification.

## Architecture

The payment system consists of the following components:

1. **Payment Service**: A service that communicates with the PayByLink API and manages payment-related operations.
2. **Payment Controller**: Handles HTTP requests for payment operations.
3. **Payment Model**: Stores payment information in the database.
4. **Payment Notification System**: Handles asynchronous notifications from the payment gateway.
5. **Payment Verification**: Verifies payment status before allowing file downloads.

## Configuration

The payment system is configured through environment variables:

- `PAYMENT_REQUIRED`: Boolean flag to enable/disable payment requirement.
- `PAYMENT_SERVICE_URL`: URL of the PayByLink API.
- `PAYMENT_SECRET_KEY`: Secret key for signing PayByLink requests.
- `PAYMENT_SHOP_ID`: Shop ID for PayByLink integration.
- `PDF_TO_DOCX_PRICE`: Price for PDF to DOCX conversion.
- `DOCX_TO_PDF_PRICE`: Price for DOCX to PDF conversion.
- `DEFAULT_PAYMENT_CURRENCY`: Default currency for payments (e.g., "PLN").

## Payment Flow

1. **Conversion Completion**:
   - User initiates a document conversion.
   - Conversion is processed and completed.
   - Result file is stored with `type: 'conversion_result'` flag.

2. **Payment Initiation**:
   - When user attempts to download the converted file, the system checks if payment is required.
   - If payment is required and not yet completed, user is redirected to initiate payment.
   - User calls `/api/payments/initiate/:conversionId` to create a payment.
   - System generates a payment request and sends it to PayByLink.
   - PayByLink returns a payment URL where the user is redirected to complete the payment.

3. **Payment Processing**:
   - User completes payment on the PayByLink payment page.
   - PayByLink sends a notification to `/api/payments/notify`.
   - System verifies the notification signature and updates the payment status.
   - If payment is successful, the conversion is marked as paid.

4. **Secure File Download**:
   - User requests a download token for the converted file.
   - System verifies payment status before generating the token.
   - If payment is complete, a secure download token is generated.
   - User downloads the file using the secure token.

## API Endpoints

### Payment Initiation

```
POST /api/payments/initiate/:conversionId
```

Initiates a payment for a conversion. Returns a payment URL where the user is redirected to complete the payment.

#### Request

```json
{
  "successUrl": "https://example.com/payment/success",
  "cancelUrl": "https://example.com/payment/cancel"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "paymentId": "12345-67890-abcdef",
    "paymentUrl": "https://paybylink.pl/payment/12345",
    "amount": 4.99,
    "currency": "PLN"
  }
}
```

### Payment Status

```
GET /api/payments/status/:conversionId
```

Returns the payment status for a conversion.

#### Response

```json
{
  "success": true,
  "data": {
    "isPaid": true,
    "payment": {
      "id": "60a1e2c9c7d1b84b0a1e1e9f",
      "status": "completed",
      "provider": "paybylink",
      "amount": 4.99,
      "currency": "PLN",
      "createdAt": "2025-03-25T10:15:30Z",
      "completedAt": "2025-03-25T10:20:45Z"
    }
  }
}
```

### Payment Notification

```
POST /api/payments/notify
```

Webhook endpoint for PayByLink to send payment notifications. Requires a valid signature in the `X-Signature` header.

#### Request

```json
{
  "control": "12345-67890-abcdef",
  "transactionId": "987654321",
  "status": "SUCCESS",
  "amount": "4.99",
  "currency": "PLN"
}
```

#### Response

```json
{
  "success": true
}
```

### Internal Payment Verification

```
GET /api/payments/internal/status/:conversionId
```

Internal API to verify payment status for a conversion. Used by other services in the system. Requires the `Authorization` header with the internal API key.

#### Request Headers

```
User-Id: 60a1e2c9c7d1b84b0a1e1e9f
Authorization: Bearer internal-api-key
```

#### Response

```json
{
  "success": true,
  "data": {
    "isPaid": true,
    "payment": {
      "id": "60a1e2c9c7d1b84b0a1e1e9f",
      "status": "completed",
      "provider": "paybylink",
      "amount": 4.99,
      "currency": "PLN",
      "createdAt": "2025-03-25T10:15:30Z",
      "completedAt": "2025-03-25T10:20:45Z"
    }
  }
}
```

## Security Considerations

- **Signature Verification**: All notifications from PayByLink are verified using HMAC-SHA256 signatures to prevent tampering.
- **Payment Verification**: File downloads are only allowed after verifying payment status.
- **Secure Tokens**: Download tokens are time-limited and securely signed.
- **Internal API Key**: The internal API for payment verification is protected by an API key.

## Testing

Integration tests are provided for the payment system in `/tests/integration/payment-integration.test.js`. These tests cover:

1. Payment creation
2. Payment notification handling
3. Payment verification

## Error Handling

The payment system includes comprehensive error handling for various scenarios:

- Invalid payment notifications
- Failed payment initiation
- Network errors during communication with PayByLink
- Database errors during payment processing

## Known Limitations

1. Currently, only PayByLink is supported as a payment provider.
2. The system does not support subscription-based payments.
3. There is no support for partial payments or refunds.

## Future Enhancements

1. Support for additional payment providers (Stripe, PayPal)
2. Subscription-based payment model
3. Invoice generation for payments
4. Payment analytics and reporting
5. User-friendly payment UI with clear pricing information