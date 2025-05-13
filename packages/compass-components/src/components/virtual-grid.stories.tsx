import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VirtualGrid } from './virtual-grid';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

interface GridItem {
  id: number;
  title: string;
  content: string;
}

const meta: Meta<typeof VirtualGrid> = {
  title: 'Components/Virtualization/VirtualGrid',
  component: VirtualGrid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    itemMinWidth: {
      control: 'number',
      description: 'Minimum width of each grid item',
    },
    itemHeight: {
      control: 'number',
      description: 'Height of each grid item',
    },
    itemsCount: {
      control: 'number',
      description: 'Total number of items in the grid',
    },
    colCount: {
      control: 'number',
      description: 'Number of columns in the grid (optional)',
    },
    overscanCount: {
      control: 'number',
      description: 'Number of items to render outside the visible area',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VirtualGrid>;

// Generate a list of items for demonstration
const generateItems = (count: number): GridItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    title: `Item ${i + 1}`,
    content: `This is the content for item ${i + 1}`,
  }));

const items = generateItems(1000);

const containerStyles = css({
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  gridTemplateColumns: '100%',
  outline: 'none',
});

const rowStyles = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: spacing[200],
  padding: spacing[200],
});

const gridItemStyles = css({
  padding: spacing[3],
  backgroundColor: 'white',
  border: '1px solid var(--leafygreen-ui-gray-light-2)',
  borderRadius: '4px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[2],
});

const StoryWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div style={{ width: '800px', height: '600px', border: '1px solid #ccc' }}>
    {children}
  </div>
);
StoryWrapper.displayName = 'StoryWrapper';

const BasicExample = () => {
  const renderItem: React.FC<{
    index: number;
    ['data-vlist-item-idx']: number;
  }> = ({ index }) => {
    const item = items[index];
    return (
      <div className={gridItemStyles}>
        <h3 style={{ margin: 0 }}>{item.title}</h3>
        <p style={{ margin: 0 }}>{item.content}</p>
      </div>
    );
  };
  renderItem.displayName = 'renderItem';

  return (
    <div className={containerStyles}>
      <VirtualGrid
        itemMinWidth={200}
        itemHeight={150}
        itemsCount={items.length}
        renderItem={renderItem}
        overscanCount={3}
        classNames={{ container: containerStyles, row: rowStyles }}
        resetActiveItemOnBlur={false}
      />
    </div>
  );
};
BasicExample.displayName = 'BasicExample';

const WithHeaderExample = () => {
  const renderItem: React.FC<{
    index: number;
    ['data-vlist-item-idx']: number;
  }> = ({ index }) => {
    const item = items[index];
    return (
      <div className={gridItemStyles}>
        <h3 style={{ margin: 0 }}>{item.title}</h3>
        <p style={{ margin: 0 }}>{item.content}</p>
      </div>
    );
  };
  renderItem.displayName = 'renderItem';

  const renderHeader = () => (
    <div
      style={{
        padding: spacing[3],
        backgroundColor: 'var(--leafygreen-ui-gray-light-3)',
        borderBottom: '1px solid var(--leafygreen-ui-gray-light-2)',
      }}
    >
      <h2 style={{ margin: 0 }}>Grid Header</h2>
      <p style={{ margin: '8px 0 0 0' }}>
        This is a header that stays fixed while the grid content scrolls
      </p>
    </div>
  );
  renderHeader.displayName = 'renderHeader';

  return (
    <div className={containerStyles}>
      <VirtualGrid
        itemMinWidth={200}
        itemHeight={150}
        itemsCount={items.length}
        renderItem={renderItem}
        headerHeight={100}
        renderHeader={renderHeader}
        overscanCount={3}
        classNames={{ container: containerStyles, row: rowStyles }}
        resetActiveItemOnBlur={false}
      />
    </div>
  );
};
WithHeaderExample.displayName = 'WithHeaderExample';

const EmptyStateExample = () => {
  const renderItem: React.FC<{
    index: number;
    ['data-vlist-item-idx']: number;
  }> = ({ index }) => {
    const item = items[index];
    return (
      <div className={gridItemStyles}>
        <h3 style={{ margin: 0 }}>{item.title}</h3>
        <p style={{ margin: 0 }}>{item.content}</p>
      </div>
    );
  };
  renderItem.displayName = 'renderItem';

  const renderEmptyList = () => (
    <div
      style={{
        padding: spacing[4],
        textAlign: 'center',
        color: 'var(--leafygreen-ui-gray-base)',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0' }}>No Items Found</h3>
      <p style={{ margin: 0 }}>
        There are no items to display in the grid at this time.
      </p>
    </div>
  );
  renderEmptyList.displayName = 'renderEmptyList';

  return (
    <div className={containerStyles}>
      <VirtualGrid
        itemMinWidth={200}
        itemHeight={150}
        itemsCount={0}
        renderItem={renderItem}
        renderEmptyList={renderEmptyList}
        overscanCount={3}
        classNames={{ container: containerStyles, row: rowStyles }}
        resetActiveItemOnBlur={false}
      />
    </div>
  );
};
EmptyStateExample.displayName = 'EmptyStateExample';

export const Basic: Story = {
  render: BasicExample,
  decorators: [
    (Story: React.ComponentType) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Basic virtual grid with fixed-size items.',
      },
      source: {
        code: `
import { VirtualGrid } from '@mongodb-js/compass-components';

function BasicGrid() {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    title: \`Item \${i + 1}\`,
    content: \`This is the content for item \${i + 1}\`,
  }));

  const renderItem = ({ index }) => {
    const item = items[index];
    return (
      <div style={{ padding: '16px', border: '1px solid #eee' }}>
        <h3>{item.title}</h3>
        <p>{item.content}</p>
      </div>
    );
  };

  return (
    <VirtualGrid
      itemMinWidth={200}
      itemHeight={150}
      itemsCount={items.length}
      renderItem={renderItem}
      overscanCount={3}
      classNames={{ container: containerStyles, row: rowStyles }}
      resetActiveItemOnBlur={false}
    />
  );
}`,
      },
    },
  },
};

export const WithHeader: Story = {
  render: WithHeaderExample,
  decorators: [
    (Story: React.ComponentType) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Virtual grid with a fixed header that stays in place while content scrolls.',
      },
      source: {
        code: `
import { VirtualGrid } from '@mongodb-js/compass-components';

function GridWithHeader() {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    title: \`Item \${i + 1}\`,
    content: \`This is the content for item \${i + 1}\`,
  }));

  const renderItem = ({ index }) => {
    const item = items[index];
    return (
      <div style={{ padding: '16px', border: '1px solid #eee' }}>
        <h3>{item.title}</h3>
        <p>{item.content}</p>
      </div>
    );
  };

  const renderHeader = () => (
    <div style={{ padding: '16px', backgroundColor: '#f5f5f5' }}>
      <h2>Grid Header</h2>
      <p>This header stays fixed while the grid content scrolls</p>
    </div>
  );

  return (
    <VirtualGrid
      itemMinWidth={200}
      itemHeight={150}
      itemsCount={items.length}
      renderItem={renderItem}
      headerHeight={100}
      renderHeader={renderHeader}
      overscanCount={3}
      classNames={{ container: containerStyles, row: rowStyles }}
      resetActiveItemOnBlur={false}
    />
  );
}`,
      },
    },
  },
};

export const EmptyState: Story = {
  render: EmptyStateExample,
  decorators: [
    (Story: React.ComponentType) => (
      <StoryWrapper>
        <Story />
      </StoryWrapper>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Virtual grid showing an empty state when there are no items.',
      },
      source: {
        code: `
import { VirtualGrid } from '@mongodb-js/compass-components';

function EmptyGrid() {
  const renderItem = ({ index }) => {
    return (
      <div style={{ padding: '16px', border: '1px solid #eee' }}>
        <h3>Item {index + 1}</h3>
        <p>Content for item {index + 1}</p>
      </div>
    );
  };

  const renderEmptyList = () => (
    <div style={{ padding: '32px', textAlign: 'center' }}>
      <h3>No Items Found</h3>
      <p>There are no items to display in the grid at this time.</p>
    </div>
  );

  return (
    <VirtualGrid
      itemMinWidth={200}
      itemHeight={150}
      itemsCount={0}
      renderItem={renderItem}
      renderEmptyList={renderEmptyList}
      overscanCount={3}
      classNames={{ container: containerStyles, row: rowStyles }}
      resetActiveItemOnBlur={false}
    />
  );
}`,
      },
    },
  },
};
