import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChevronCollapse } from './chevron-collapse-icon';
import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';

const meta = {
  title: 'Components/ChevronCollapse',
  component: ChevronCollapse,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <LeafyGreenProvider>
        <Story />
      </LeafyGreenProvider>
    ),
  ],
  argTypes: {
    width: {
      control: 'number',
      description: 'The width of the icon in pixels',
    },
    height: {
      control: 'number',
      description: 'The height of the icon in pixels',
    },
  },
} satisfies Meta<typeof ChevronCollapse>;

export default meta;
type Story = StoryObj<typeof ChevronCollapse>;

/**
 * The ChevronCollapse component is a simple icon that displays a chevron
 * pointing in both up and down directions. It's commonly used to indicate
 * collapsible sections or navigation.
 *
 * Features:
 * - Configurable dimensions
 * - Automatic dark mode support
 * - Consistent styling with LeafyGreen design system
 */

export const Default: Story = {
  args: {
    width: 16,
    height: 16,
  },
};

export const Large: Story = {
  args: {
    width: 24,
    height: 24,
  },
};

export const CustomSize: Story = {
  args: {
    width: 32,
    height: 32,
  },
};
