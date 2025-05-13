import type { Meta, StoryObj } from '@storybook/react';
import { HorizontalRule } from './horizontal-rule';

const meta = {
  title: 'Components/HorizontalRule',
  component: HorizontalRule,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
  },
} satisfies Meta<typeof HorizontalRule>;

export default meta;
type Story = StoryObj<typeof HorizontalRule>;

/**
 * The HorizontalRule component provides a visual separator between content sections.
 *
 * Features:
 * - Consistent styling with LeafyGreen design system
 * - Automatic dark mode support
 * - Customizable through className prop
 */

export const Default: Story = {
  args: {},
};

export const WithCustomClass: Story = {
  args: {
    className: 'custom-hr',
  },
};

export const WithMargin: Story = {
  args: {
    className: 'custom-hr',
    style: { margin: '20px 0' },
  },
};
