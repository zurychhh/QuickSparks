import { create } from '@storybook/theming/create';

export default create({
  base: 'light',
  // Typography
  fontBase: '"Segoe UI", "Helvetica Neue", sans-serif',
  fontCode: 'monospace',
  
  // Brand
  brandTitle: 'QuickSparks UI',
  brandUrl: 'https://github.com/zurychhh/QuickSparks',
  brandTarget: '_blank',
  
  // Colors
  colorPrimary: '#3498db',
  colorSecondary: '#2980b9',
  
  // UI
  appBg: '#f8f8f8',
  appContentBg: '#ffffff',
  appBorderColor: '#dddddd',
  appBorderRadius: 4,
  
  // Text colors
  textColor: '#333333',
  textInverseColor: '#ffffff',
});