// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  root: false,
  extends: ['../../.eslintrc.js'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['src']
      }
    }
  },
  rules: {
    // Allow React default import
    'import/default': 'off',
    'import/no-named-as-default-member': 'off',
    
    // Disable use-before-define for React components
    'no-use-before-define': 'off',
    
    // Make return types optional for now (can be enforced later)
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    
    // Increase max-len to accommodate some longer lines
    'max-len': ['warn', { code: 120 }],
    
    // Increase complexity limit for Input component
    'complexity': ['warn', 16]
  }
};

module.exports = config;