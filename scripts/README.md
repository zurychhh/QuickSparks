# Automation Scripts

This directory contains automation scripts to help with common development tasks in the QuickSparks Conversion Microservices project.

## Available Scripts

### Service Management

- **create-microservice.js**: Creates a new microservice with proper boilerplate
  ```bash
  # Usage:
  pnpm create:service --name my-service [--type express|nest] [--port 3001]
  ```

- **dev.sh**: Starts services in development mode
  ```bash
  # Usage:
  pnpm dev                # Start all services
  ./scripts/dev.sh gateway  # Start gateway only
  ./scripts/dev.sh pdf-service  # Start PDF service only
  ```

### Database Management

- **db-setup.js**: Helps with database setup, migrations, and seeding
  ```bash
  # Usage:
  pnpm db:setup --service my-service    # Set up database for a service
  pnpm db:migrate --service my-service  # Run migrations
  pnpm db:seed --service my-service     # Seed database with test data
  ```

### Component Creation

- **create-component.js**: Creates a new React component in the UI library
  ```bash
  # Usage:
  pnpm create:component --name Button [--type atom|molecule|organism] [--withTest]
  ```

### Git Workflow

- **create-feature.sh**: Creates a new feature branch with proper naming
  ```bash
  # Usage:
  pnpm create:feature feature-name "Feature description"
  ```

- **release.sh**: Automates the release process
  ```bash
  # Usage:
  pnpm release [major|minor|patch]
  ```

### Environment Setup

- **setup-environment.sh**: Sets up the development environment for new contributors
  ```bash
  # Usage:
  pnpm setup
  ```

## Adding New Scripts

When adding new scripts to this directory, follow these guidelines:

1. Use appropriate shebang lines:
   - For Bash scripts: `#!/bin/bash`
   - For Node.js scripts: `#!/usr/bin/env node`

2. Make scripts executable:
   ```bash
   chmod +x scripts/your-script-name.sh
   ```

3. Add a description and usage examples as comments at the top of the script

4. Add an entry in package.json's "scripts" section for easy access

5. Update this README with information about the new script

## Best Practices

- Keep scripts modular and focused on a single task
- Add proper error handling and validation
- Use descriptive variable names
- Add helpful output with color coding when appropriate
- Include interactive confirmation for destructive operations