import React from 'react';
import { storybookArgTypes, StoryMetaType } from '@lg-tools/storybook-utils';
import { StoryObj } from '@storybook/react';

import { glyphs } from '@leafygreen-ui/icon';

import { AvatarProps, AvatarSize, Format } from './Avatar/Avatar.types';
import { getInitials } from './utils/getInitials';
import { Avatar } from '.';

export default {
  title: 'Components/Display/Avatar',
  component: Avatar,
  parameters: {
    default: 'LiveExample',
    controls: {
      exclude: [],
    },
    generate: {
      storyNames: ['MongoAvatar', 'TextAvatar', 'IconAvatar', 'ImageAvatar'],
      combineArgs: {
        darkMode: [false, true],
        size: Object.values(AvatarSize),
        sizeOverride: [undefined, 64],
      },
      excludeCombinations: [
        {
          size: [AvatarSize.Large, AvatarSize.XLarge],
          sizeOverride: 64,
        },
      ],
    },
  },
  args: {
    format: Format.Icon,
    size: AvatarSize.Default,
    glyph: 'PersonGroup',
    text: 'AT',
  },
  argTypes: {
    darkMode: storybookArgTypes.darkMode,
    format: {
      control: 'select',
      options: Object.values(Format),
    },
    size: {
      control: 'select',
      options: Object.values(AvatarSize),
    },
    sizeOverride: {
      control: 'number',
    },
    glyph: {
      control: 'select',
      options: Object.keys(glyphs),
      if: { arg: 'format', eq: Format.Icon },
    },
    text: {
      control: 'text',
      if: { arg: 'format', eq: Format.Text },
    },
  },
} satisfies StoryMetaType<typeof Avatar>;

export const LiveExample: StoryObj<AvatarProps> = {
  render: args => {
    return <Avatar {...args} />;
  },
  parameters: {
    controls: {
      exclude: ['sizeOverride'],
    },
    chromatic: {
      disableSnapshot: true,
    },
  },
};

export const SizeOverride: StoryObj<AvatarProps> = {
  render: args => {
    return <Avatar {...args} />;
  },
  parameters: {
    controls: {
      exclude: ['size'],
    },
    chromatic: {
      disableSnapshot: true,
    },
  },
  args: {
    sizeOverride: 42,
  },
};

export const InitialsDemo: StoryObj<AvatarProps & { name: string }> = {
  render: args => {
    const { initials } = getInitials(args.name);
    return <Avatar {...args} text={initials} />;
  },
  parameters: {
    controls: {
      exclude: ['sizeOverride', 'format', 'text'],
    },
    chromatic: {
      disableSnapshot: true,
    },
  },
  args: {
    format: Format.Text,
    name: 'Vincent van Gogh',
    size: AvatarSize.XLarge,
  },
  argTypes: {
    name: {
      control: 'text',
      description:
        '**STORYBOOK ONLY**: A full name that passes through the `getInitials` function before being passed to Avatar as `text`',
    },
  },
};

export const MongoAvatar: StoryObj<typeof Avatar> = {
  render: () => <></>,
  args: {
    format: Format.MongoDB,
  },
  parameters: {
    controls: {
      exclude: ['darkMode', 'format', 'size', 'sizeOverride', 'glyph', 'text'],
    },
  },
};
export const TextAvatar: StoryObj<typeof Avatar> = {
  render: () => <></>,
  parameters: {
    controls: {
      exclude: ['darkMode', 'format', 'size', 'sizeOverride', 'glyph', 'text'],
    },
    generate: {
      combineArgs: {
        text: ['A', 'MW', null],
      },
    },
  },
  args: {
    format: Format.Text,
  },
};
export const IconAvatar: StoryObj<typeof Avatar> = {
  render: () => <></>,
  parameters: {
    controls: {
      exclude: ['darkMode', 'format', 'size', 'sizeOverride', 'glyph', 'text'],
    },
    generate: {
      combineArgs: {
        glyph: ['Person', 'GovernmentBuilding'],
      },
    },
  },
  args: {
    format: Format.Icon,
  },
};
