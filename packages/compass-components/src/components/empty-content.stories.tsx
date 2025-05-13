import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EmptyContent } from './empty-content';
import { DocumentIcon } from './icons/document-icon';
import { FavoriteIcon } from './icons/favorite-icon';
import { NoSavedItemsIcon } from './icons/no-saved-items-icon';
import { ServerIcon } from './icons/server-icon';

const DocumentIconWrapper = () => <DocumentIcon />;
DocumentIconWrapper.displayName = 'DocumentIcon';

const ServerIconWrapper = () => <ServerIcon />;
ServerIconWrapper.displayName = 'ServerIcon';

const FavoriteIconWrapper = () => <FavoriteIcon isFavorite={false} />;
FavoriteIconWrapper.displayName = 'FavoriteIcon';

const NoSavedItemsIconWrapper = () => <NoSavedItemsIcon />;
NoSavedItemsIconWrapper.displayName = 'NoSavedItemsIcon';

const meta: Meta<typeof EmptyContent> = {
  title: 'Components/EmptyContent',
  component: EmptyContent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: [
        'DocumentIcon',
        'ServerIcon',
        'FavoriteIcon',
        'NoSavedItemsIcon',
      ],
      mapping: {
        DocumentIcon: DocumentIconWrapper,
        ServerIcon: ServerIconWrapper,
        FavoriteIcon: FavoriteIconWrapper,
        NoSavedItemsIcon: NoSavedItemsIconWrapper,
      },
      description: 'Icon to display in the empty state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyContent>;

export const Default: Story = {
  args: {
    title: 'No Content',
    subTitle: 'There is no content to display at this time.',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'No Documents',
    subTitle: 'There are no documents in this collection.',
    icon: DocumentIconWrapper,
  },
};

export const WithAction: Story = {
  args: {
    title: 'No Saved Queries',
    subTitle: "You haven't saved any queries yet.",
    icon: FavoriteIconWrapper,
    callToAction: 'Click here to create your first query',
  },
};
