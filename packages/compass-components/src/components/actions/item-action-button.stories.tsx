import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ItemActionButton } from './item-action-button';
import { Icon } from '../leafygreen';
import { ItemActionButtonSize } from './constants';

const meta = {
  title: 'Components/Actions/ItemActionButton',
  component: ItemActionButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    action: {
      control: 'text',
      description: 'The action identifier',
    },
    icon: {
      control: 'select',
      options: ['Play', 'Stop', 'Pause'],
      mapping: {
        Play: <Icon glyph="Play" />,
        Stop: <Icon glyph="Stop" />,
        Pause: <Icon glyph="Pause" />,
      },
      description: 'The icon to display in the button',
    },
    label: {
      control: 'text',
      description: 'The label for the button',
    },
    tooltip: {
      control: 'text',
      description: 'Optional tooltip text (if not provided, label is used)',
    },
    iconSize: {
      control: 'select',
      options: Object.values(ItemActionButtonSize),
      description: 'The size of the button',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    onClick: {
      action: 'clicked',
      description: 'Function called when the button is clicked',
    },
  },
} satisfies Meta<typeof ItemActionButton>;

export default meta;
type Story = StoryObj<typeof ItemActionButton>;

/**
 * The ItemActionButton component is a button that displays an icon and can be used in item lists or tables.
 * It wraps the SmallIconButton component and adds additional functionality for item actions.
 *
 * Features:
 * - Icon display with optional tooltip
 * - Multiple size options
 * - Disabled state support
 * - Click handler
 * - Data attributes for testing and action identification
 * - Dark mode support
 */

export const Play: Story = {
  args: {
    action: 'play',
    icon: <Icon glyph="Play" />,
    label: 'Play',
    iconSize: ItemActionButtonSize.Default,
  },
};

export const Stop: Story = {
  args: {
    action: 'stop',
    icon: <Icon glyph="Stop" />,
    label: 'Stop',
    iconSize: ItemActionButtonSize.Default,
  },
};

export const Pause: Story = {
  args: {
    action: 'pause',
    icon: <Icon glyph="Pause" />,
    label: 'Pause',
    iconSize: ItemActionButtonSize.Default,
  },
};

export const WithTooltip: Story = {
  args: {
    action: 'play',
    icon: <Icon glyph="Play" />,
    label: 'Play',
    tooltip: 'Start playback',
    iconSize: ItemActionButtonSize.Default,
  },
};

export const Small: Story = {
  args: {
    action: 'play',
    icon: <Icon glyph="Play" />,
    label: 'Play',
    iconSize: ItemActionButtonSize.Small,
  },
};

export const XSmall: Story = {
  args: {
    action: 'play',
    icon: <Icon glyph="Play" />,
    label: 'Play',
    iconSize: ItemActionButtonSize.XSmall,
  },
};

export const Disabled: Story = {
  args: {
    action: 'play',
    icon: <Icon glyph="Play" />,
    label: 'Play',
    iconSize: ItemActionButtonSize.Default,
    isDisabled: true,
  },
};
