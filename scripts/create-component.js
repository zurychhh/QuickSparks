#!/usr/bin/env node

/**
 * Create UI Component Script
 * 
 * This script automates the creation of a new React component in the UI library
 * with proper file structure, TypeScript types, and Storybook stories.
 * 
 * Usage:
 * node scripts/create-component.js --name Button [--type atom|molecule|organism] [--withTest]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Parse command line arguments
const args = process.argv.slice(2);
let componentName = '';
let componentType = 'atom'; // Default to atom
let withTest = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' && args[i + 1]) {
    componentName = args[i + 1];
    i++;
  } else if (args[i] === '--type' && args[i + 1]) {
    componentType = args[i + 1];
    i++;
  } else if (args[i] === '--withTest') {
    withTest = true;
  }
}

// Validate arguments
if (!componentName) {
  console.error('Error: Component name is required (--name Button)');
  process.exit(1);
}

if (!['atom', 'molecule', 'organism'].includes(componentType)) {
  console.error('Error: Component type must be "atom", "molecule", or "organism"');
  process.exit(1);
}

// Ensure first letter is uppercase for component name
componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

// Confirm component creation
console.log(`Creating new ${componentType} component: ${componentName}`);
console.log(`With tests: ${withTest ? 'Yes' : 'No'}`);

rl.question('Continue? (y/n) ', (answer) => {
  if (answer.toLowerCase() !== 'y') {
    console.log('Operation cancelled');
    rl.close();
    process.exit(0);
  }

  rl.close();
  createComponent();
});

function createComponent() {
  const uiComponentsDir = path.join(process.cwd(), 'packages', 'ui-components');
  
  // Make sure ui-components directory exists
  if (!fs.existsSync(uiComponentsDir)) {
    console.error(`Error: ui-components directory not found at ${uiComponentsDir}`);
    console.log('Make sure you are running this script from the project root');
    process.exit(1);
  }
  
  // Define component directory based on type
  let componentsTypeDir;
  if (componentType === 'atom') {
    componentsTypeDir = path.join(uiComponentsDir, 'src', 'components', 'atoms');
  } else if (componentType === 'molecule') {
    componentsTypeDir = path.join(uiComponentsDir, 'src', 'components', 'molecules');
  } else if (componentType === 'organism') {
    componentsTypeDir = path.join(uiComponentsDir, 'src', 'components', 'organisms');
  }
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(componentsTypeDir)) {
    fs.mkdirSync(componentsTypeDir, { recursive: true });
  }
  
  // Create component directory
  const componentDir = path.join(componentsTypeDir, componentName);
  
  // Check if component already exists
  if (fs.existsSync(componentDir)) {
    console.error(`Error: Component '${componentName}' already exists at ${componentDir}`);
    process.exit(1);
  }
  
  // Create component directory
  fs.mkdirSync(componentDir, { recursive: true });
  
  // Create component files
  createComponentFiles(componentDir, componentName, withTest);
  
  console.log(`\n✅ Component '${componentName}' created successfully at ${componentDir}`);
}

function createComponentFiles(componentDir, componentName, withTest) {
  // Create component file
  const componentContent = `import React from 'react';
import { ${componentName}Props } from './${componentName}.types';
import './${componentName}.css';

/**
 * ${componentName} component
 */
export const ${componentName}: React.FC<${componentName}Props> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={\`${componentName.toLowerCase()} \${className}\`} {...props}>
      {children}
    </div>
  );
};

export default ${componentName};
`;

  fs.writeFileSync(path.join(componentDir, `${componentName}.tsx`), componentContent);
  
  // Create types file
  const typesContent = `import { HTMLAttributes } from 'react';

/**
 * ${componentName} component props
 */
export interface ${componentName}Props extends HTMLAttributes<HTMLDivElement> {
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Component children
   */
  children?: React.ReactNode;
}
`;

  fs.writeFileSync(path.join(componentDir, `${componentName}.types.ts`), typesContent);
  
  // Create CSS file
  const cssContent = `.${componentName.toLowerCase()} {
  /* Add your styles here */
}
`;

  fs.writeFileSync(path.join(componentDir, `${componentName}.css`), cssContent);
  
  // Create Storybook file
  const storybookContent = `import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from './${componentName}';

/**
 * ${componentName} component meta
 */
const meta: Meta<typeof ${componentName}> = {
  title: '${capitalizeFirstLetter(componentType)}s/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Define your argTypes here
  },
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

/**
 * Default story
 */
export const Default: Story = {
  args: {
    children: '${componentName} Component',
  },
};

/**
 * With custom className
 */
export const WithCustomClass: Story = {
  args: {
    children: '${componentName} with custom class',
    className: 'custom-class',
  },
};
`;

  fs.writeFileSync(path.join(componentDir, `${componentName}.stories.tsx`), storybookContent);
  
  // Create index file
  const indexContent = `export { default as ${componentName} } from './${componentName}';
export type { ${componentName}Props } from './${componentName}.types';
`;

  fs.writeFileSync(path.join(componentDir, 'index.ts'), indexContent);
  
  // Create test file if requested
  if (withTest) {
    const testContent = `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('renders children correctly', () => {
    render(<${componentName}>Test Content</${componentName}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<${componentName} className="custom-class">Test</${componentName}>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
`;

    fs.writeFileSync(path.join(componentDir, `${componentName}.test.tsx`), testContent);
  }
  
  console.log(`Created files for ${componentName} component:`);
  console.log(`- ${componentName}.tsx`);
  console.log(`- ${componentName}.types.ts`);
  console.log(`- ${componentName}.css`);
  console.log(`- ${componentName}.stories.tsx`);
  console.log(`- index.ts`);
  if (withTest) {
    console.log(`- ${componentName}.test.tsx`);
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}