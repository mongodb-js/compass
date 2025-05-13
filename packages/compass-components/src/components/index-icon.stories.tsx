import type { Meta, StoryObj } from '@storybook/react';
import IndexIcon from './index-icon';

const meta = {
  title: 'Components/IndexIcon',
  component: IndexIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: [1, -1, 'text'],
      description:
        'The direction of the index (1 for ascending, -1 for descending, or text for other values)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
  },
} satisfies Meta<typeof IndexIcon>;

export default meta;
type Story = StoryObj<typeof IndexIcon>;

/**
 * The IndexIcon component displays an icon or text representation of an index direction.
 * It's commonly used to show the sort direction of database indexes.
 *
 * Features:
 * - Visual representation of index direction
 * - Support for ascending (1) and descending (-1) directions
 * - Fallback text display for other values
 * - Accessible with ARIA labels
 * - Custom styling support
 */

export const Ascending: Story = {
  args: {
    direction: 1,
  },
};

export const Descending: Story = {
  args: {
    direction: -1,
  },
};

export const TextDirection: Story = {
  args: {
    direction: 'text',
  },
};

export const WithCustomClassName: Story = {
  args: {
    direction: 1,
    className: 'custom-index-icon',
  },
};
