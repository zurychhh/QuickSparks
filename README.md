# QuickSparks Conversion Microservices

A microservices-based platform for high-quality file conversions and document utilities.

![CI](https://github.com/QuickSparks/PDFSpark/actions/workflows/ci.yml/badge.svg)
![Frontend Deploy](https://github.com/QuickSparks/PDFSpark/actions/workflows/deploy-frontend.yml/badge.svg)
![API Deploy](https://github.com/QuickSparks/PDFSpark/actions/workflows/deploy-api.yml/badge.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

## Features

- **PDF Conversion Service**: Convert PDF to DOCX and DOCX to PDF with high accuracy
- **Image Processing Service**: Resize, optimize, and convert images between formats
- **QR Code Generation**: Create customizable QR codes from text or URLs
- **Authentication**: Secure API access with JWT authentication
- **API Gateway**: Unified API with request validation and routing

## Architecture

Built as a pnpm monorepo with a modular microservices architecture:

```
conversion-microservices/
├── packages/            # Shared packages and libraries
│   ├── pdf-service-test/  # PDF conversion testing environment
│   ├── shared/           # Shared code and utilities
│   └── ui-components/    # Reusable UI components
├── services/            # Microservices
│   ├── pdf-service/      # PDF conversion service
│   ├── image-service/    # Image conversion service
│   └── qr-service/       # QR code service
├── gateway/             # API gateway
├── docs/                # Documentation
└── tests/               # Integration tests
```

## Technologies

- **Backend**: Node.js, Express, NestJS
- **Data Validation**: JSON Schema
- **Type Safety**: TypeScript
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT
- **Quality Assurance**: ESLint, Jest, GitHub Actions

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- pnpm 8.x or higher
- Docker and Docker Compose (for containerized development)

### Installation

```bash
# Clone the repository
git clone https://github.com/quicksparks/conversion-microservices.git
cd conversion-microservices

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run linting
pnpm lint

# Run PDF service tests
pnpm pdf-test:dev
```

## API Documentation

API documentation is available at [docs/api.yaml](./docs/api.yaml) in OpenAPI format.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Development Workflow

1. Create a feature branch from `develop`
2. Make your changes
3. Submit a pull request to `develop`
4. After review and approval, changes will be merged
5. Releases to `main` are managed via release branches

See our [development workflow documentation](./docs/workflow.md) for more details.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.