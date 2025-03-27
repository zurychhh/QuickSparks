# Code Quality Standards

This document outlines the code quality standards and tools used in the QuickSparks Conversion Microservices project.

## Tools

The project uses the following code quality tools:

- **ESLint**: For static code analysis and enforcing coding conventions
- **Prettier**: For consistent code formatting
- **TypeScript**: For static type checking
- **Husky**: For git hooks
- **lint-staged**: For running linters on staged git files
- **Jest**: For unit and integration testing
- **EditorConfig**: For consistent editor settings

## Installation

All necessary tools are installed as dev dependencies in the project. Make sure to run:

```bash
pnpm install
```

## Code Style

We follow a standard code style enforced by ESLint and Prettier. Key aspects include:

- 2 spaces for indentation
- Single quotes for strings
- Semicolons at the end of statements
- Space after function names
- 100 character line length limit (with exceptions for strings and comments)
- Unix line endings (LF)
- Trailing commas in multi-line objects and arrays

## Commands

The following commands can be used to check and fix code quality issues:

```bash
# Check code with ESLint
pnpm lint

# Fix ESLint issues automatically
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check if code is properly formatted
pnpm format:check

# Run both linting and format checking
pnpm check

# Fix all issues (lint and format)
pnpm fix
```

## Pre-commit Hooks

The project uses Husky to set up git hooks that automatically run linting and formatting checks before each commit. If the checks fail, the commit will be blocked.

The pre-commit hook configuration can be found in:
- `.husky/pre-commit`
- `.lintstagedrc`

## VSCode Integration

If you use Visual Studio Code, the project includes configuration files for a seamless development experience:

- `.vscode/settings.json`: Editor settings
- `.vscode/extensions.json`: Recommended extensions

With the recommended extensions installed, VSCode will:
- Format on save
- Show ESLint errors and warnings inline
- Provide auto-fix options for many issues

## Type Safety

We use TypeScript for type safety. The TypeScript configuration is in:
- `tsconfig.json`

The project enforces:
- Explicit return types for functions
- Warnings for `any` type usage
- Strict null checks
- No implicit any

## Maintainability Rules

ESLint enforces rules that help maintain code quality:

- Maximum nesting depth of 4
- Maximum of 3 nested callbacks
- Maximum of 4 parameters for functions
- Complexity limit of 10

## Security

ESLint includes security plugins to detect common security issues in the code.

## Continuous Integration

All pull requests are automatically checked for code quality issues using GitHub Actions. The workflow can be found in:
- `.github/workflows/code-quality.yml`

For a PR to be merged:
- All ESLint checks must pass
- Code must be properly formatted
- Tests must pass

## Documentation Standards

Code should be self-documenting, but we also encourage:

- JSDoc comments for functions and classes
- Meaningful variable and function names
- Comments for complex logic
- README files for each package