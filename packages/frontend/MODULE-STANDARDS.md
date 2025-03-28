# Module System Standardization

This document outlines the standardized approach to module imports and exports for the PDFSpark project.

## Table of Contents

1. [Overview](#overview)
2. [ESM Standards](#esm-standards)
3. [Import Organization](#import-organization)
4. [Export Patterns](#export-patterns)
5. [Type Imports](#type-imports)
6. [Utilities](#utilities)
7. [ESLint Configuration](#eslint-configuration)

## Overview

As part of Phase 2 stability improvements, we've standardized on ECMAScript Modules (ESM) throughout the codebase, replacing any existing CommonJS patterns. This provides better tree-shaking, more readable imports, and better TypeScript integration.

## ESM Standards

### Use ESM Import Syntax

✅ **Good:**
```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';
```

❌ **Bad:**
```typescript
const { useState, useEffect } = require('react');
const axios = require('axios');
```

### Use ESM Export Syntax

✅ **Good:**
```typescript
export function formatDate(date: Date): string {
  // implementation
}

export const API_URL = 'https://api.example.com';
```

❌ **Bad:**
```typescript
function formatDate(date: Date) {
  // implementation
}

const API_URL = 'https://api.example.com';

module.exports = {
  formatDate,
  API_URL
};
```

## Import Organization

Imports should be organized in the following order with blank lines between groups:

1. React imports
2. External libraries
3. Absolute internal imports (using @ aliases)
4. Relative parent imports
5. Relative sibling imports
6. Type imports
7. Style imports
8. Asset imports

**Example:**
```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import axios from 'axios';
import { format } from 'date-fns';

import { useAuth } from '@/hooks/useAuth';
import Button from '@components/ui/Button';

import { getDataFromParent } from '../../utils/data';

import { formatLocalData } from './helpers';

import type { User } from '@/types';
import type { ButtonProps } from '@components/ui/Button';

import './styles.css';

import logoImage from './logo.png';
```

## Export Patterns

### Prefer Named Exports

Named exports are preferred over default exports as they provide better refactorability and make imports more consistent.

✅ **Good:**
```typescript
// Button.tsx
export function Button(props) { /*...*/ }

// index.ts (if needed for barrel exports)
export { Button } from './Button';
```

⚠️ **Acceptable for component files only:**
```typescript
// Button.tsx
export default function Button(props) { /*...*/ }
```

❌ **Bad:**
```typescript
// utils.ts
export default {
  formatDate: () => { /*...*/ },
  parseDate: () => { /*...*/ }
};
```

### Use Barrel Exports for Feature Folders

For feature folders, use barrel exports (index.ts) to simplify imports:

```typescript
// components/Button/index.ts
export * from './Button';
export * from './ButtonGroup';
```

## Type Imports

### Use Type Imports for TypeScript Types

Use explicit `type` imports for better clarity and to enable proper tree-shaking:

✅ **Good:**
```typescript
import type { User, Post } from '@/types';
import { useState } from 'react';
```

❌ **Bad:**
```typescript
import { User, Post, useState } from 'react';
```

## Utilities

Several utilities have been added to help standardize module imports:

### Scripts

- `npm run fix:imports` - Standardize import organization
- `npm run check:imports` - Check if imports follow standards without fixing
- `npm run fix:modules` - Convert CommonJS patterns to ESM
- `npm run check:modules` - Check for CommonJS patterns
- `npm run fix:all` - Run all fixes in the correct order

### ESLint Configuration

A specialized ESLint configuration has been added (`.eslintrc.module.cjs`) that enforces module standards.

To lint with this configuration:
```bash
npm run lint:modules
```

To auto-fix issues:
```bash
npm run lint:modules:fix
```

## ESLint Configuration

The ESLint module configuration enforces the following rules:

- No CommonJS require statements
- No CommonJS module.exports
- Named exports preferred over default exports
- Consistent import ordering
- Type imports for TypeScript types
- No extraneous dependencies

These rules are configurable in `.eslintrc.module.cjs`.

---

By following these standards, we ensure a consistent and maintainable codebase with proper static analysis support.