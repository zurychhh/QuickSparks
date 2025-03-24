# QuickSparks Project Structure

This document outlines the project structure for the QuickSparks conversion microservices monorepo.

## Overview

The project is organized as a monorepo using pnpm workspaces to manage multiple packages and services. This structure provides several benefits:

- **Modularity**: Clear separation of concerns between different services and components
- **Code Reuse**: Shared libraries and utilities can be easily used across the project
- **Consistent Development Experience**: Common tooling and processes across all parts of the project
- **Simplified Dependency Management**: Dependencies are hoisted and shared when possible

## Directory Structure

```
conversion-microservices/
├── .github/                     # GitHub configuration and workflows
│   ├── workflows/               # CI/CD workflows
│   ├── ISSUE_TEMPLATE/          # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md # PR template
│   ├── CODEOWNERS               # Repository code owners
│   └── branch-protection.yml    # Branch protection rules
│
├── docs/                        # Project documentation
│   ├── api.yaml                 # API specifications (OpenAPI/Swagger)
│   ├── workflow.md              # Git workflow documentation
│   ├── code-quality.md          # Code quality standards
│   ├── project-structure.md     # Project structure documentation (this file)
│   └── tutorial.md              # Onboarding tutorials
│
├── gateway/                     # API Gateway service
│   ├── routes/                  # Route definitions
│   ├── server.js                # Server entry point
│   └── public/                  # Static assets
│
├── packages/                    # Shared packages and services
│   ├── auth-service/            # Authentication service
│   │   ├── src/                 # Source code
│   │   │   ├── controllers/     # Controller logic
│   │   │   ├── dto/             # Data transfer objects
│   │   │   ├── guards/          # Authentication guards
│   │   │   ├── middleware/      # Middleware
│   │   │   └── services/        # Business logic services
│   │   └── test/                # Tests
│   │
│   ├── pdf-service/             # PDF conversion service
│   │   ├── src/                 # Source code
│   │   │   ├── controllers/     # Controller logic
│   │   │   ├── converters/      # Conversion implementations
│   │   │   ├── middleware/      # Middleware
│   │   │   └── services/        # Business logic services
│   │   ├── test/                # Tests
│   │   └── storage/             # File storage (temp)
│   │
│   ├── image-service/           # Image conversion service
│   │   ├── src/                 # Source code
│   │   │   ├── controllers/     # Controller logic
│   │   │   ├── converters/      # Conversion implementations
│   │   │   ├── middleware/      # Middleware
│   │   │   └── services/        # Business logic services
│   │   ├── test/                # Tests
│   │   └── storage/             # File storage (temp)
│   │
│   ├── qr-service/              # QR code service
│   │   ├── src/                 # Source code
│   │   │   ├── controllers/     # Controller logic
│   │   │   ├── generators/      # QR code generation logic
│   │   │   ├── middleware/      # Middleware
│   │   │   └── services/        # Business logic services
│   │   ├── test/                # Tests
│   │   └── storage/             # File storage (temp)
│   │
│   ├── pdf-service-test/        # PDF service test environment
│   │   ├── src/                 # Source code
│   │   │   ├── converters/      # Different converter implementations
│   │   │   ├── __tests__/       # Tests
│   │   │   └── ...              # Other modules
│   │   ├── test-docs/           # Test documents
│   │   ├── test-files/          # Test files
│   │   ├── outputs/             # Conversion outputs
│   │   ├── reports/             # Benchmark and quality reports
│   │   └── results/             # Test results
│   │
│   ├── shared/                  # Shared utilities and code
│   │   ├── src/                 # Source code
│   │   │   ├── validation/      # Validation utilities
│   │   │   ├── schemas/         # Common schemas (JSON Schema)
│   │   │   └── generated/       # Generated types/interfaces
│   │   ├── scripts/             # Utility scripts
│   │   └── test/                # Tests
│   │
│   └── ui-components/           # Shared UI components
│       ├── src/                 # Source code
│       │   └── components/      # React components
│       └── test/                # Tests
│
├── scripts/                     # Automation scripts
│   ├── create-microservice.js   # Service generation script
│   ├── create-feature.sh        # Feature branch creation
│   ├── create-component.js      # UI component generator
│   ├── dev.sh                   # Development environment script
│   ├── db-setup.js              # Database management
│   ├── release.sh               # Release automation
│   ├── setup-environment.sh     # Environment setup
│   └── README.md                # Scripts documentation
│
├── services/                    # Production-ready services
│   ├── pdf-service/             # Production PDF service
│   ├── image-service/           # Production Image service
│   └── qr-service/              # Production QR service
│
├── shared/                      # Common resources for all services
│   ├── config/                  # Configuration files
│   ├── middlewares/             # Common middleware
│   └── utils/                   # Shared utilities
│
├── tests/                       # Integration and E2E tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
│
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .editorconfig                # Editor configuration
├── jest.config.js               # Jest configuration (root)
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Main Dockerfile
├── pnpm-workspace.yaml          # PNPM workspace config
├── package.json                 # Root package.json
└── README.md                    # Project documentation
```

## Architecture Overview

### Microservices Architecture

The project follows a microservices architecture with these core services:

1. **API Gateway**: Single entry point for clients, handles routing and basic request validation
2. **PDF Service**: Handles PDF conversion operations
3. **Image Service**: Manages image conversion and processing
4. **QR Service**: Generates and processes QR codes
5. **Auth Service**: Manages authentication and authorization

### Package Organization

The project uses three main categories:

1. **packages/**: Contains shared libraries and development services
2. **services/**: Contains production-ready microservices
3. **gateway/**: API Gateway service

### Common Components

Shared functionality is organized in these locations:

1. **packages/shared/**: Common utilities, validation, and schemas
2. **packages/ui-components/**: Reusable UI components
3. **shared/**: Common resources for all services

## Development Workflow

1. Services are developed within the `packages/` directory during initial development
2. When ready for production, they are promoted to the `services/` directory
3. The `scripts/` directory contains automation to simplify common development tasks

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

## Configuration Management

Configuration follows these principles:

1. Default configurations in config files
2. Environment-specific overrides via environment variables
3. Secrets managed via environment variables (never committed to the repository)

## Testing Strategy

The project uses a comprehensive testing approach:

1. Unit tests in each service's `test/` directory
2. Integration tests in the root `tests/integration/` directory
3. End-to-end tests in the root `tests/e2e/` directory