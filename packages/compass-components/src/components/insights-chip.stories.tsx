import type { Meta, StoryObj } from '@storybook/react';
import { InsightsChip } from './insights-chip';

const meta = {
  title: 'Components/InsightsChip',
  component: InsightsChip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The text to display in the chip',
    },
  },
} satisfies Meta<typeof InsightsChip>;

export default meta;
type Story = StoryObj<typeof InsightsChip>;

/**
 * The InsightsChip component is used to display insights or tags in a compact format.
 *
 * Features:
 * - Compact design
 * - Consistent styling with LeafyGreen design system
 * - Automatic dark mode support
 */

export const Default: Story = {
  args: {
    label: 'Insight',
  },
};

export const LongLabel: Story = {
  args: {
    label: 'This is a very long insight label that might wrap',
  },
};
