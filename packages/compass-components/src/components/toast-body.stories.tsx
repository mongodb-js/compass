import type { Meta, StoryObj } from '@storybook/react';
import { ToastBody } from './toast-body';

const meta = {
  title: 'Components/ToastBody',
  component: ToastBody,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    statusMessage: {
      control: 'text',
      description: 'The main message to display in the toast',
    },
    actionText: {
      control: 'text',
      description: 'The text for the action button (if any)',
    },
    actionHandler: {
      action: 'clicked',
      description: 'Function called when the action button is clicked',
    },
  },
} satisfies Meta<typeof ToastBody>;

export default meta;
type Story = StoryObj<typeof ToastBody>;

/**
 * The ToastBody component is used to display the content of a toast notification.
 * It supports both a status message and an optional action button.
 *
 * Features:
 * - Flexible layout with message and action button
 * - Optional action button with custom text
 * - Consistent styling with LeafyGreen design system
 * - Test ID support for action buttons
 */

export const Default: Story = {
  args: {
    statusMessage: 'Operation completed successfully',
  },
};

export const WithAction: Story = {
  args: {
    statusMessage: 'Operation completed successfully',
    actionText: 'View Details',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    actionHandler: () => {},
  },
};

export const LongMessage: Story = {
  args: {
    statusMessage:
      'This is a very long message that might wrap to multiple lines in the toast notification. It demonstrates how the component handles longer content.',
    actionText: 'View Details',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    actionHandler: () => {},
  },
};

export const WithoutAction: Story = {
  args: {
    statusMessage: 'Operation completed successfully',
  },
};
