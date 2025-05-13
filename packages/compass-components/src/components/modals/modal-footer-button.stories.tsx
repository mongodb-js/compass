import type { Meta, StoryObj } from '@storybook/react';
import { ModalFooterButton } from './modal-footer-button';

const meta = {
  title: 'Components/Modals/ModalFooterButton',
  component: ModalFooterButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'default', 'danger'],
      description: 'The button variant',
    },
    size: {
      control: 'select',
      options: ['default', 'small', 'xsmall'],
      description: 'The button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    onClick: {
      action: 'clicked',
      description: 'Function called when the button is clicked',
    },
  },
} satisfies Meta<typeof ModalFooterButton>;

export default meta;
type Story = StoryObj<typeof ModalFooterButton>;

/**
 * The ModalFooterButton component is a button specifically designed for use in modal footers.
 * It extends the LeafyGreen Button component with additional styling for modal contexts.
 *
 * Features:
 * - Multiple variants (primary, default, danger)
 * - Multiple sizes
 * - Disabled state support
 * - Click handler
 * - Dark mode support
 * - Proper spacing in modal footers
 */

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Save Changes',
  },
};

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Cancel',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

export const Small: Story = {
  args: {
    variant: 'primary',
    size: 'small',
    children: 'Save Changes',
  },
};

export const XSmall: Story = {
  args: {
    variant: 'primary',
    size: 'xsmall',
    children: 'Save Changes',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Save Changes',
    disabled: true,
  },
};
