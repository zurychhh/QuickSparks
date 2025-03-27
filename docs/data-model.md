# QuickSparks Data Model

This document defines the data model for the QuickSparks application, designed to efficiently store and manage conversion operations, user data, and transaction information.

## Overview

The data model is designed with the following goals:

- Support core conversion functionality with detailed tracking
- Enable user management and authentication
- Track payment transactions and subscription status
- Maintain audit trails for compliance and analytics
- Support future feature expansion

## Entity Relationship Diagram

The following diagram shows the relationships between key entities in our data model:

```
+-------------+       +---------------+       +----------------+
|    User     |-------|  Conversion   |-------| ConversionFile |
+-------------+       +---------------+       +----------------+
      |                      |                        
      |                      |                        
      |                      |                        
+-------------+       +---------------+               
| Subscription|-------| Transaction   |               
+-------------+       +---------------+               
```

## Core Entities

### User

Stores information about registered users.

```javascript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  email: String,                // User's email (unique)
  passwordHash: String,         // Hashed password
  salt: String,                 // Password salt
  firstName: String,            // User's first name
  lastName: String,             // User's last name
  role: String,                 // User role (user, admin)
  status: String,               // Account status (active, suspended, deleted)
  emailVerified: Boolean,       // Whether email has been verified
  verificationToken: String,    // Token for email verification
  resetPasswordToken: String,   // Token for password reset
  resetPasswordExpires: Date,   // Expiration for password reset token
  createdAt: Date,              // Account creation timestamp
  updatedAt: Date,              // Last update timestamp
  lastLoginAt: Date,            // Last login timestamp
  preferences: {                // User preferences
    language: String,           // Preferred language
    theme: String,              // UI theme preference
    notifications: Boolean      // Notification settings
  },
  usageStats: {                 // Usage statistics
    conversionsCount: Number,   // Total number of conversions
    totalUploadSize: Number,    // Total size of uploaded files (bytes)
    totalDownloadSize: Number,  // Total size of downloaded files (bytes)
    lastConversionAt: Date      // Last conversion timestamp
  },
  metadata: Object              // Additional extensible metadata
}
```

### Conversion

Represents a conversion operation with its status and results.

```javascript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  userId: ObjectId,             // Reference to User
  type: String,                 // Conversion type (pdf-to-docx, docx-to-pdf, etc.)
  status: String,               // Status (pending, processing, completed, failed)
  startedAt: Date,              // When conversion was started
  completedAt: Date,            // When conversion was completed
  durationMs: Number,           // Processing duration in milliseconds
  inputFiles: [ObjectId],       // References to input ConversionFiles
  outputFiles: [ObjectId],      // References to output ConversionFiles
  settings: {                   // Conversion settings
    quality: String,            // Quality setting (high, medium, low)
    preserveFormatting: Boolean,// Whether to preserve formatting
    options: Object             // Additional conversion-specific options
  },
  processingData: {             // Processing details
    converter: String,          // Converter used (e.g., 'pdf-lib', 'mammoth')
    attempts: Number,           // Number of processing attempts
    logs: [String],             // Processing logs
    error: String               // Error message if failed
  },
  qualityMetrics: {             // Quality assessment metrics
    textAccuracy: Number,       // Text extraction accuracy score
    formattingAccuracy: Number, // Formatting preservation score
    imageQuality: Number,       // Image quality score
    overallScore: Number        // Overall quality score
  },
  expiresAt: Date,              // When files will be deleted
  accessToken: String,          // Token for accessing result
  accessCount: Number,          // Number of times result was accessed
  ipAddress: String,            // IP address of requester
  userAgent: String,            // User agent of requester
  metadata: Object              // Additional extensible metadata
}
```

### ConversionFile

Represents a file used in or created by a conversion process.

```javascript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  conversionId: ObjectId,       // Reference to Conversion
  userId: ObjectId,             // Reference to User
  type: String,                 // File type (input, output)
  originalFilename: String,     // Original filename
  storedFilename: String,       // Filename in storage
  storagePath: String,          // Path in storage system
  mimeType: String,             // MIME type
  extension: String,            // File extension
  sizeBytes: Number,            // File size in bytes
  checksum: String,             // File checksum for verification
  createdAt: Date,              // Creation timestamp
  expiresAt: Date,              // Expiration timestamp
  status: String,               // Status (available, deleted)
  accessToken: String,          // Token for secure access
  metadata: Object              // Additional file metadata
}
```

### Subscription

Tracks user subscription information.

```javascript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  userId: ObjectId,             // Reference to User
  plan: String,                 // Subscription plan (free, basic, premium)
  status: String,               // Status (active, cancelled, expired)
  startDate: Date,              // Subscription start date
  endDate: Date,                // Subscription end date
  renewalDate: Date,            // Next renewal date
  paymentMethod: {              // Payment method details
    type: String,               // Method type (card, paypal)
    lastFour: String,           // Last four digits (for cards)
    expiryMonth: Number,        // Expiry month (for cards)
    expiryYear: Number,         // Expiry year (for cards)
    token: String               // Payment token reference
  },
  features: {                   // Plan features
    maxFileSize: Number,        // Maximum file size in bytes
    monthlyQuota: Number,       // Monthly conversion quota
    usedQuota: Number,          // Used conversion quota
    advancedFeatures: Boolean,  // Access to advanced features
    priority: Boolean           // Priority processing
  },
  billingHistory: [ObjectId],   // References to Transactions
  autoRenew: Boolean,           // Auto-renewal setting
  createdAt: Date,              // Creation timestamp
  updatedAt: Date,              // Last update timestamp
  metadata: Object              // Additional extensible metadata
}
```

### Transaction

Records payment transactions.

```javascript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  userId: ObjectId,             // Reference to User
  subscriptionId: ObjectId,     // Reference to Subscription
  amount: Number,               // Transaction amount
  currency: String,             // Currency code
  type: String,                 // Transaction type (subscription, one-time)
  status: String,               // Status (pending, completed, failed, refunded)
  paymentProcessor: String,     // Payment processor (PayByLink, Stripe)
  paymentMethod: String,        // Payment method (card, transfer)
  processorTransactionId: String,// ID from payment processor
  invoiceNumber: String,        // Invoice number
  description: String,          // Transaction description
  createdAt: Date,              // Creation timestamp
  completedAt: Date,            // Completion timestamp
  refundedAt: Date,             // Refund timestamp
  failureReason: String,        // Reason for failure
  billingAddress: {             // Billing address information
    name: String,               // Full name
    address: String,            // Street address
    city: String,               // City
    state: String,              // State/Province
    postalCode: String,         // Postal code
    country: String             // Country
  },
  taxInfo: {                    // Tax information
    taxRate: Number,            // Applied tax rate
    taxAmount: Number,          // Tax amount
    vatNumber: String           // VAT number if applicable
  },
  receiptUrl: String,           // URL to receipt
  metadata: Object              // Additional extensible metadata
}
```

## Supporting Collections

### AuditLog

Tracks important system events for security and compliance.

```javascript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  userId: ObjectId,             // Reference to User (if applicable)
  entityType: String,           // Entity type (user, conversion, etc.)
  entityId: ObjectId,           // Reference to entity
  action: String,               // Action performed (create, update, delete)
  timestamp: Date,              // When action occurred
  ipAddress: String,            // IP address
  userAgent: String,            // User agent
  details: Object,              // Action-specific details
  previousData: Object,         // Data before change
  newData: Object               // Data after change
}
```

### ApiKey

Manages API keys for programmatic access.

```javascript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  userId: ObjectId,             // Reference to User
  name: String,                 // Key name/description
  key: String,                  // Hashed API key
  permissions: [String],        // Permitted operations
  createdAt: Date,              // Creation timestamp
  expiresAt: Date,              // Expiration timestamp
  lastUsedAt: Date,             // Last usage timestamp
  status: String,               // Status (active, revoked)
  revokedAt: Date,              // Revocation timestamp
  revokedReason: String,        // Reason for revocation
  usageCount: Number,           // Usage count
  rateLimits: {                 // Rate limiting settings
    requestsPerMinute: Number,  // Requests per minute limit
    requestsPerDay: Number      // Requests per day limit
  }
}
```

### SystemSettings

Stores application-wide settings.

```javascript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  key: String,                  // Setting key (unique)
  value: Mixed,                 // Setting value
  description: String,          // Setting description
  category: String,             // Setting category
  isPublic: Boolean,            // Whether visible to users
  updatedAt: Date,              // Last update timestamp
  updatedBy: ObjectId           // Reference to User who updated
}
```

## Data Relationships

- **User to Conversion**: One-to-many. A user can have multiple conversions.
- **Conversion to ConversionFile**: One-to-many. A conversion can have multiple input and output files.
- **User to Subscription**: One-to-one. A user has one active subscription.
- **Subscription to Transaction**: One-to-many. A subscription can have multiple transactions.
- **User to Transaction**: One-to-many. A user can have multiple transactions.

## Indexing Strategy

Key indexes to optimize query performance:

- `User`: `email` (unique), `status`, `role`
- `Conversion`: `userId`, `status`, `createdAt`, `type`
- `ConversionFile`: `conversionId`, `userId`, `type`, `status`
- `Subscription`: `userId` (unique), `status`, `endDate`
- `Transaction`: `userId`, `subscriptionId`, `status`, `createdAt`
- `AuditLog`: `userId`, `entityType`, `entityId`, `timestamp`
- `ApiKey`: `userId`, `key` (unique), `status`
- `SystemSettings`: `key` (unique), `category`

## Data Lifecycle Management

- **Temporary Files**: Automatically deleted after 24 hours for non-premium users, 7 days for premium users
- **Conversion Records**: Retained for 30 days for non-premium users, 1 year for premium users
- **User Data**: Retained as long as the account is active, anonymized 30 days after account deletion
- **Transaction Records**: Retained for 7 years for regulatory compliance
- **Audit Logs**: Retained for 2 years for security and compliance purposes

## GDPR Compliance Considerations

- **Data Minimization**: Only necessary data is collected and stored
- **Right to Access**: Users can download all their personal data
- **Right to Erasure**: User data can be completely deleted upon request
- **Data Portability**: User data can be exported in standard formats
- **Consent Management**: Clear consent tracking for data processing
- **Data Encryption**: Sensitive data is encrypted at rest and in transit

## Future Extensions

The data model is designed to accommodate future extensions:

1. **Advanced Analytics**: Additional fields for conversion quality metrics
2. **Team Collaboration**: Organizational structures and sharing permissions
3. **Document Management**: Folders and organization for converted files
4. **Advanced Processing**: Batch operations and workflow definitions
5. **Integrations**: Connection details for third-party services

## Implementation Notes

For the MVP implementation, we'll use MongoDB as our primary database with Mongoose as the ODM layer. This provides:

- Flexible schema evolution as requirements change
- Efficient document-based storage for file metadata
- Good performance for our access patterns
- Simple scalability path as the application grows

The data model balances normalization and denormalization to optimize for the most common queries while maintaining data integrity.