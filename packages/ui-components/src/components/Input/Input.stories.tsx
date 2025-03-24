import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number'],
    },
    onChange: { action: 'changed' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    helperText: 'Password must be at least 8 characters',
    type: 'password',
    placeholder: 'Enter your password',
  },
};

export const WithError: Story = {
  args: {
    label: 'Username',
    error: 'Username already taken',
    placeholder: 'Enter a username',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width Input',
    placeholder: 'This input takes up 100% width',
    fullWidth: true,
  },
};