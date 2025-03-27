# Contributing to QuickSparks Conversion Microservices

Thank you for your interest in contributing to the QuickSparks Conversion Microservices project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read it before contributing.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported by searching GitHub Issues
2. If the bug hasn't been reported, create a new issue using the Bug Report template
3. Include as much detail as possible in your report:
   - Clear steps to reproduce
   - Expected vs. actual behavior
   - Screenshots if applicable
   - Environment details

### Suggesting Features

1. Check if the feature has already been suggested by searching GitHub Issues
2. If not, create a new issue using the Feature Request template
3. Describe the feature in detail, including:
   - The problem it solves
   - How it should work
   - User stories or use cases
   - Mockups or examples (if applicable)

### Pull Requests

1. Fork the repository
2. Create a new branch from the `develop` branch
   ```
   git checkout -b feature/your-feature-name
   ```
   or
   ```
   git checkout -b fix/your-fix-name
   ```
3. Make your changes, adhering to the coding standards
4. Add tests for your changes
5. Ensure all tests pass
6. Update documentation if necessary
7. Commit your changes with clear, descriptive messages
8. Push your branch to your fork
9. Submit a pull request to the `develop` branch

### Branch Naming Convention

- `feature/` - For new features
- `fix/` - For bug fixes
- `docs/` - For documentation updates
- `refactor/` - For code refactoring
- `test/` - For adding or updating tests
- `chore/` - For maintenance tasks

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code changes that neither fix a bug nor add a feature
- test: Adding or updating tests
- chore: Changes to the build process or auxiliary tools

Example:
```
feat(pdf-service): add support for PDF annotations

Implemented annotation extraction in PDF to DOCX conversion.
```

## Development Environment

### Prerequisites

- Node.js 16.x or higher
- pnpm 8.x or higher
- Docker and Docker Compose

### Setup

1. Clone the repository
   ```
   git clone https://github.com/your-org/conversion-microservices.git
   cd conversion-microservices
   ```

2. Install dependencies
   ```
   pnpm install
   ```

3. Start development servers
   ```
   pnpm dev
   ```

4. Run tests
   ```
   pnpm test
   ```

### Project Structure

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

## Testing

- Write unit tests for all new code
- Run tests before submitting a PR
- Make sure all tests pass

## Code Style

- We use ESLint for JavaScript/TypeScript code linting
- Follow the existing code style in the project
- Run the linter before submitting your PR
  ```
  pnpm lint
  ```

## Documentation

- Update documentation when making changes
- Document all new features, APIs, and components
- Use JSDoc comments for code documentation

## Getting Help

If you need help, you can:
- Create a discussion in the GitHub Discussions
- Ask for clarification in an issue
- Contact project maintainers

Thank you for contributing to the project!