/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // Accessibility addon
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'], // Serve static files
  typescript: {
    check: true, // Type check stories during Storybook build
    reactDocgen: 'react-docgen-typescript',
  },
  features: {
    storyStoreV7: true, // Enable modern Storybook composition
  },
};
export default config;