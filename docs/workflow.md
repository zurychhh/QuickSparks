# Development Workflow

This document outlines the development workflow for the QuickSparks Conversion Microservices project.

## Branch Structure

We follow a modified GitFlow workflow with the following branches:

- **main**: Production code - always stable and deployable
- **develop**: Development branch - integration branch for features
- **feature/xxx**: Feature branches - where new features are developed
- **fix/xxx**: Bug fix branches - for fixing bugs
- **release/vX.Y.Z**: Release branches - preparation for a new production release
- **hotfix/xxx**: Hotfix branches - for urgent fixes to production

## Development Process

### 1. Starting a New Feature

```bash
# Checkout from develop
git checkout develop
git pull
git checkout -b feature/your-feature-name
```

### 2. Working on Your Feature

- Make regular commits with clear, descriptive messages
- Keep your branch updated with develop
- Write tests for your changes

```bash
# Update your branch with develop
git checkout develop
git pull
git checkout feature/your-feature-name
git merge develop
```

### 3. Submitting Your Work

When your feature is ready:

1. Push your branch to GitHub
   ```bash
   git push -u origin feature/your-feature-name
   ```

2. Create a pull request to the develop branch
   - Fill out the PR template thoroughly
   - Request reviews from appropriate team members
   - Ensure all CI checks pass

### 4. Code Review Process

- At least one approval is required to merge
- Address all review comments
- Keep the PR updated with the latest develop changes

### 5. Merging

Once approved:
- PR will be merged to develop (squash, merge, or rebase depending on the case)
- Delete the feature branch after successful merge

### 6. Releases

Releases are created from the develop branch:

```bash
git checkout develop
git pull
git checkout -b release/vX.Y.Z
# Final testing and version number updates
git push -u origin release/vX.Y.Z
```

After testing and verification, the release branch is merged to main and develop:

```bash
# Merge to main
git checkout main
git pull
git merge release/vX.Y.Z --no-ff
git tag -a vX.Y.Z -m "Version X.Y.Z"
git push --follow-tags

# Backport to develop
git checkout develop
git pull
git merge release/vX.Y.Z --no-ff
git push
```

### 7. Hotfixes

For urgent fixes to production:

```bash
git checkout main
git pull
git checkout -b hotfix/issue-description
# Make changes and commit
git push -u origin hotfix/issue-description
```

Create PRs to both main and develop.

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR version**: Incompatible API changes
- **MINOR version**: Backward-compatible new functionality
- **PATCH version**: Backward-compatible bug fixes

## Continuous Integration

All branches and PRs are automatically tested via GitHub Actions with:

- Linting
- Unit tests
- Integration tests
- Build verification

## Deployment

- **Staging environment**: Automatically deployed from the develop branch
- **Production environment**: Manually triggered deployment from the main branch

## Issue Tracking

- Use GitHub Issues for bug reports and feature requests
- Link PRs to relevant issues
- Use appropriate labels and milestones