# Production Services

This directory contains the production-ready microservices for the QuickSparks project.

## Services

### PDF Service

Located in `pdf-service/`, this service handles PDF file operations:
- PDF to DOCX conversion
- DOCX to PDF conversion
- PDF optimization
- PDF text extraction
- PDF metadata management

### Image Service

Located in `image-service/`, this service handles image processing operations:
- Image format conversion (PNG, JPG, WebP, etc.)
- Image optimization
- Image resizing and cropping
- Image metadata extraction

### QR Service

Located in `qr-service/`, this service handles QR code operations:
- QR code generation
- QR code reading/parsing
- QR code styling and customization

## Service Structure

Each service follows a consistent structure:

```
service-name/
├── src/                  # Source code
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Service-specific middleware
│   └── [specialized]/    # Service-specific folders (e.g., converters)
├── test/                 # Tests
└── storage/              # Temporary file storage (if needed)
```

## Development Guidelines

1. **API Consistency**: All services should maintain consistent API patterns
2. **Error Handling**: Use standardized error responses across all services
3. **Validation**: Implement thorough input validation
4. **Testing**: Maintain high test coverage
5. **Documentation**: Keep API documentation up-to-date
6. **Logging**: Use the shared logging utilities for consistent logging
7. **Configuration**: Use environment variables for configuration, with defaults

## Deployment

Services are containerized using Docker and can be deployed:
- Individually using their respective Dockerfiles
- Together using the root docker-compose.yml file

## Local Development

To run a service locally:

```bash
# From the project root
pnpm --filter @conversion-microservices/[service-name] dev

# Example
pnpm --filter @conversion-microservices/pdf-service dev
```