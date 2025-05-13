import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SmallIconButton } from './small-icon-button';
import { Icon } from '../leafygreen';

const meta = {
  title: 'Components/Actions/SmallIconButton',
  component: SmallIconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    glyph: {
      control: 'select',
      options: ['Play', 'Stop', 'Pause'],
      mapping: {
        Play: <Icon glyph="Play" />,
        Stop: <Icon glyph="Stop" />,
        Pause: <Icon glyph="Pause" />,
      },
      description: 'The icon to display in the button',
    },
    size: {
      control: 'select',
      options: ['default', 'small', 'xsmall'],
      description: 'The size of the button',
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
} satisfies Meta<typeof SmallIconButton>;

export default meta;
type Story = StoryObj<typeof SmallIconButton>;

/**
 * The SmallIconButton component is a compact button that displays an icon.
 * It's designed for use in tight spaces where a full button would be too large.
 *
 * Features:
 * - Icon-only display
 * - Multiple size options
 * - Disabled state support
 * - Click handler
 * - Dark mode support
 */

export const Play: Story = {
  args: {
    glyph: <Icon glyph="Play" />,
    label: 'Play',
    size: 'default',
  },
};

export const Stop: Story = {
  args: {
    glyph: <Icon glyph="Stop" />,
    label: 'Stop',
    size: 'default',
  },
};

export const Pause: Story = {
  args: {
    glyph: <Icon glyph="Pause" />,
    label: 'Pause',
    size: 'default',
  },
};

export const Small: Story = {
  args: {
    glyph: <Icon glyph="Play" />,
    label: 'Play',
    size: 'small',
  },
};

export const XSmall: Story = {
  args: {
    glyph: <Icon glyph="Play" />,
    label: 'Play',
    size: 'xsmall',
  },
};

export const Disabled: Story = {
  args: {
    glyph: <Icon glyph="Play" />,
    label: 'Play',
    size: 'default',
    disabled: true,
  },
};
