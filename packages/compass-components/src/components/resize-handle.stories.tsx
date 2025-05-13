import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ResizeHandle, ResizeDirection } from './resize-handle';

const meta = {
  title: 'Components/ResizeHandle',
  component: ResizeHandle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: [ResizeDirection.TOP, ResizeDirection.RIGHT],
      description: 'The direction of the resize handle',
    },
    step: {
      control: 'number',
      description: 'The step size for keyboard navigation',
    },
    value: {
      control: 'number',
      description: 'The current value',
    },
    minValue: {
      control: 'number',
      description: 'The minimum allowed value',
    },
    maxValue: {
      control: 'number',
      description: 'The maximum allowed value',
    },
    onChange: {
      action: 'changed',
      description: 'Function called when the value changes',
    },
    title: {
      control: 'text',
      description: 'The title of the resizable element',
    },
  },
} satisfies Meta<typeof ResizeHandle>;

export default meta;
type Story = StoryObj<typeof ResizeHandle>;

/**
 * The ResizeHandle component provides a draggable handle for resizing elements.
 * It supports both vertical and horizontal resizing with keyboard navigation.
 *
 * Features:
 * - Vertical and horizontal resizing
 * - Keyboard navigation support
 * - Mouse drag support
 * - Min/max value constraints
 * - Step size control
 * - Accessible with ARIA attributes
 */

const ResizeHandleWrapper = (
  args: React.ComponentProps<typeof ResizeHandle>
) => {
  const [value, setValue] = useState(args.value);
  return (
    <div
      style={{
        position: 'relative',
        width: '300px',
        height: '200px',
        border: '1px solid #ccc',
      }}
    >
      <ResizeHandle {...args} value={value} onChange={setValue} />
    </div>
  );
};
ResizeHandleWrapper.displayName = 'ResizeHandleWrapper';

const VerticalStory = (args: React.ComponentProps<typeof ResizeHandle>) => (
  <ResizeHandleWrapper {...args} />
);
VerticalStory.displayName = 'VerticalStory';

const HorizontalStory = (args: React.ComponentProps<typeof ResizeHandle>) => (
  <ResizeHandleWrapper {...args} />
);
HorizontalStory.displayName = 'HorizontalStory';

const WithSmallStepStory = (
  args: React.ComponentProps<typeof ResizeHandle>
) => <ResizeHandleWrapper {...args} />;
WithSmallStepStory.displayName = 'WithSmallStepStory';

const WithLargeStepStory = (
  args: React.ComponentProps<typeof ResizeHandle>
) => <ResizeHandleWrapper {...args} />;
WithLargeStepStory.displayName = 'WithLargeStepStory';

export const Vertical: Story = {
  args: {
    direction: ResizeDirection.RIGHT,
    value: 150,
    minValue: 100,
    maxValue: 200,
    step: 10,
    title: 'Resizable Panel',
  },
  render: VerticalStory,
};

export const Horizontal: Story = {
  args: {
    direction: ResizeDirection.TOP,
    value: 100,
    minValue: 50,
    maxValue: 150,
    step: 10,
    title: 'Resizable Panel',
  },
  render: HorizontalStory,
};

export const WithSmallStep: Story = {
  args: {
    direction: ResizeDirection.RIGHT,
    value: 150,
    minValue: 100,
    maxValue: 200,
    step: 1,
    title: 'Resizable Panel',
  },
  render: WithSmallStepStory,
};

export const WithLargeStep: Story = {
  args: {
    direction: ResizeDirection.RIGHT,
    value: 150,
    minValue: 100,
    maxValue: 200,
    step: 20,
    title: 'Resizable Panel',
  },
  render: WithLargeStepStory,
};
