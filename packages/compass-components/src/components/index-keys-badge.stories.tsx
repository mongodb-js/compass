import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { IndexKeysBadge, IndexBadge } from './index-keys-badge';

const meta: Meta<typeof IndexKeysBadge> = {
  title: 'Components/IndexKeysBadge',
  component: IndexKeysBadge,
  argTypes: {
    keys: {
      description: 'Array of key objects with field and value properties',
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

type Story = StoryObj<typeof IndexKeysBadge>;

export const Default: Story = {
  args: {
    keys: [
      { field: 'name', value: 1 },
      { field: 'age', value: -1 },
      { field: 'email', value: 1 },
    ],
  },
};

export const SingleKey: Story = {
  args: {
    keys: [{ field: 'name', value: 1 }],
  },
};

export const WithNestedFields: Story = {
  args: {
    keys: [
      { field: 'profile.name', value: 1 },
      { field: 'profile.address.city', value: -1 },
      { field: 'metadata.tags', value: 1 },
    ],
  },
};

export const WithLongFieldNames: Story = {
  args: {
    keys: [
      { field: 'reallyLongFieldNameThatMightOverflow', value: 1 },
      { field: 'anotherVeryLongFieldNameForTesting', value: -1 },
      { field: 'third.nested.long.field.name', value: 1 },
    ],
  },
};

// Showing the individual IndexBadge component
export const SingleIndexBadge: StoryObj<typeof IndexBadge> = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h3>Individual Index Badges</h3>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <IndexBadge field="name" value={1} />
        <IndexBadge field="age" value={-1} />
        <IndexBadge field="email" value={1} />
      </div>
    </div>
  ),
};
