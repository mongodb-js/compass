import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VirtualList } from './virtual-list';

interface ListItem {
  id: number;
  title: string;
  content: string;
}

const meta: Meta<typeof VirtualList<ListItem>> = {
  title: 'Components/Virtualization/VirtualList',
  component: VirtualList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    overScanCount: {
      control: 'number',
      description:
        'Number of items to keep rendered outside of the visible viewport',
    },
    rowGap: {
      control: 'number',
      description: 'Space in pixels between list items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VirtualList<ListItem>>;

// Generate a list of items for demonstration
const generateItems = (count: number): ListItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    content: `This is the content for item ${i + 1}`,
  }));

const items = generateItems(1000);

const ListItemComponent: React.FC<{
  item: ListItem;
  ref: React.Ref<HTMLDivElement>;
}> = ({ item, ref }) => (
  <div
    ref={ref}
    style={{
      padding: '16px',
      borderBottom: '1px solid #eee',
      backgroundColor: 'white',
    }}
  >
    <h3 style={{ margin: '0 0 8px 0' }}>{item.title}</h3>
    <p style={{ margin: 0 }}>{item.content}</p>
  </div>
);
ListItemComponent.displayName = 'ListItemComponent';

function renderItem(item: ListItem, ref: React.Ref<HTMLDivElement>) {
  return <ListItemComponent item={item} ref={ref} />;
}
renderItem.displayName = 'renderItem';

const StoryWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div style={{ width: '400px', height: '600px', border: '1px solid #ccc' }}>
    {children}
  </div>
);
StoryWrapper.displayName = 'StoryWrapper';

export const Default: Story = {
  args: {
    items,
    renderItem,
    estimateItemInitialHeight: () => 80,
    overScanCount: 5,
    rowGap: 0,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
};

export const WithGap: Story = {
  args: {
    items,
    renderItem,
    estimateItemInitialHeight: () => 80,
    overScanCount: 5,
    rowGap: 8,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
};

const CustomHeightItem: React.FC<{
  item: ListItem;
  ref: React.Ref<HTMLDivElement>;
}> = ({ item, ref }) => (
  <div
    ref={ref}
    style={{
      padding: '24px',
      borderBottom: '1px solid #eee',
      backgroundColor: 'white',
      height: item.id % 2 === 0 ? '120px' : '80px',
    }}
  >
    <h3 style={{ margin: '0 0 8px 0' }}>{item.title}</h3>
    <p style={{ margin: 0 }}>{item.content}</p>
  </div>
);
CustomHeightItem.displayName = 'CustomHeightItem';

function renderCustomHeightItem(
  item: ListItem,
  ref: React.Ref<HTMLDivElement>
) {
  return <CustomHeightItem item={item} ref={ref} />;
}
renderCustomHeightItem.displayName = 'renderCustomHeightItem';

export const WithCustomHeight: Story = {
  args: {
    items,
    renderItem: renderCustomHeightItem,
    estimateItemInitialHeight: (item: ListItem) =>
      item.id % 2 === 0 ? 120 : 80,
    overScanCount: 5,
    rowGap: 0,
  },
  decorators: [
    (Story: React.ComponentType) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
};
