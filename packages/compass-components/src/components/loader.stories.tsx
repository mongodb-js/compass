import type { Meta, StoryObj } from '@storybook/react';
import type {
  SpinLoaderWithLabel as SpinLoaderWithLabelType,
  CancelLoader as CancelLoaderType,
} from './loader';
import { SpinLoader } from './loader';

const meta = {
  title: 'Components/Loader',
  component: SpinLoader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'number',
      description: 'Size of the loader in pixels',
    },
    title: {
      control: 'text',
      description: 'Title attribute for accessibility',
    },
  },
} satisfies Meta<typeof SpinLoader>;

export default meta;
type Story = StoryObj<typeof SpinLoader>;

/**
 * The Loader components provide visual feedback for loading states.
 *
 * Features:
 * - Multiple loader types (Spin, Spin with Label, Cancel)
 * - Configurable sizes
 * - Optional labels
 * - Consistent styling with LeafyGreen design system
 */

export const Default: Story = {
  args: {
    size: 12,
  },
};

export const Small: Story = {
  args: {
    size: 8,
  },
};

export const Large: Story = {
  args: {
    size: 24,
  },
};

export const WithTitle: Story = {
  args: {
    size: 12,
    title: 'Loading...',
  },
};

export const WithLabel: StoryObj<typeof SpinLoaderWithLabelType> = {
  args: {
    progressText: 'Loading...',
  },
};

export const WithLongLabel: StoryObj<typeof SpinLoaderWithLabelType> = {
  args: {
    progressText:
      'Loading a very long operation that might take some time to complete...',
  },
};

export const Cancel: StoryObj<typeof CancelLoaderType> = {
  args: {
    progressText: 'Loading...',
    cancelText: 'Cancel',
    onCancel: () => {
      // Handle cancel
    },
  },
};
