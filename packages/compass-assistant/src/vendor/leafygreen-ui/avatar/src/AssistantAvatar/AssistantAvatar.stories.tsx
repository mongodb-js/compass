import React from 'react';
import { storybookArgTypes, StoryMetaType } from '@lg-tools/storybook-utils';
import { StoryObj } from '@storybook/react';

import { AvatarSize } from '../Avatar/Avatar.types';

import { AssistantAvatar } from './AssistantAvatar';
import { AssistantAvatarProps } from './AssistantAvatar.types';

export default {
  title: 'Components/Display/Avatar/AssistantAvatar',
  component: AssistantAvatar,
  parameters: {
    default: 'LiveExample',
    controls: {
      exclude: [],
    },
    generate: {
      combineArgs: {
        darkMode: [false, true],
        disabled: [false, true],
        size: Object.values(AvatarSize),
      },
    },
  },
  args: {
    size: AvatarSize.Default,
  },
  argTypes: {
    darkMode: storybookArgTypes.darkMode,
    size: {
      control: 'select',
      options: Object.values(AvatarSize),
    },
  },
} satisfies StoryMetaType<
  typeof AssistantAvatar,
  Partial<AssistantAvatarProps>
>;

export const LiveExample: StoryObj<typeof AssistantAvatar> = {
  render: args => {
    return <AssistantAvatar {...args} />;
  },
  parameters: {
    chromatic: {
      disableSnapshot: true,
    },
  },
};

export const Generated: StoryObj<typeof AssistantAvatar> = {
  render: () => <></>,
  parameters: {
    controls: {
      exclude: ['size', 'darkMode'],
    },
  },
};
