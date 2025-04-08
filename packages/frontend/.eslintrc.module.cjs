// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  root: false,
  extends: ['./.eslintrc.cjs'],
  rules: {
    // Enforce ES Module import/export style
    'import/no-commonjs': 'error',
    'import/no-amd': 'error',
    'import/no-nodejs-modules': 'warn',
    
    // Enforce import organization
    'import/order': [
      'error', 
      {
        'groups': [
          ['builtin', 'external'],
          'internal',
          ['parent', 'sibling', 'index']
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }
    ],
    
    // Enforce named over default exports for better refactoring
    'import/no-default-export': 'warn',
    
    // Prevent extraneous dependencies
    'import/no-extraneous-dependencies': [
      'error',
      {
        'devDependencies': [
          '**/*.test.{ts,tsx}',
          '**/*.spec.{ts,tsx}',
          'vite.config.ts',
          'vitest.config.ts',
          'jest.config.js',
          '**/*.stories.{ts,tsx}',
          'src/test/**/*'
        ]
      }
    ],
    
    // Ensure consistent type imports
    '@typescript-eslint/consistent-type-imports': [
      'warn', 
      { 
        'prefer': 'type-imports', 
        'disallowTypeAnnotations': false 
      }
    ],
    
    // File extension consistency
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        'js': 'never',
        'ts': 'never',
        'tsx': 'never'
      }
    ]
  }
};

module.exports = config;