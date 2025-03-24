import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    elevation: { 
      control: 'select',
      options: [0, 1, 2, 3],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    children: <p>This is the content of the card. You can place any elements here.</p>,
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Card with Footer',
    children: <p>This card has a footer with actions.</p>,
    footer: (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="secondary" size="small">Cancel</Button>
        <Button variant="primary" size="small">Save</Button>
      </div>
    ),
  },
};

export const NoTitle: Story = {
  args: {
    children: <p>This card doesn't have a title, only content.</p>,
  },
};

export const HighElevation: Story = {
  args: {
    title: 'High Elevation Card',
    children: <p>This card has the highest elevation level (3).</p>,
    elevation: 3,
  },
};

export const NoElevation: Story = {
  args: {
    title: 'Flat Card',
    children: <p>This card has no elevation, only a border.</p>,
    elevation: 0,
  },
};