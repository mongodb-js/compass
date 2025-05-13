import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ResizeHandle, ResizeDirection } from './resize-handle';
import { css } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { Resizable } from 're-resizable';

const meta = {
  title: 'Components/ResizeHandle',
  component: ResizeHandle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A resizable handle component that can be used with re-resizable to create resizable panels and sidebars.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResizeHandle>;

export default meta;

type Story = StoryObj<typeof ResizeHandle>;

const containerStyles = css({
  display: 'flex',
  width: '800px',
  height: '400px',
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '4px',
  overflow: 'hidden',
  position: 'relative',
});

const sidebarStyles = css({
  backgroundColor: palette.gray.light3,
  padding: '16px',
  overflow: 'auto',
  height: '100%',
});

const contentStyles = css({
  flex: 1,
  backgroundColor: palette.white,
  padding: '16px',
  overflow: 'auto',
  height: '100%',
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const ResizableSidebar = () => {
  return (
    <div className={containerStyles}>
      <Resizable
        defaultSize={{
          width: '300px',
          height: '100%',
        }}
        minWidth="200px"
        maxWidth="500px"
        enable={{
          right: true,
        }}
        handleComponent={{
          right: (
            <ResizeHandle
              direction={ResizeDirection.RIGHT}
              value={300}
              minValue={200}
              maxValue={500}
              onChange={noop}
              title="sidebar"
            />
          ),
        }}
        handleStyles={{
          right: {
            right: '-9px',
          },
        }}
      >
        <div className={sidebarStyles}>
          <h3>Sidebar</h3>
          <p>This is a resizable sidebar panel.</p>
          <p>Try dragging the handle or using arrow keys to resize.</p>
        </div>
      </Resizable>
      <div className={contentStyles}>
        <h3>Main Content</h3>
        <p>This is the main content area.</p>
        <p>The sidebar can be resized to adjust the layout.</p>
      </div>
    </div>
  );
};
ResizableSidebar.displayName = 'ResizableSidebar';

const SidebarStory = () => <ResizableSidebar />;
SidebarStory.displayName = 'SidebarStory';

export const Sidebar: Story = {
  render: SidebarStory,
  parameters: {
    docs: {
      source: {
        code: `
import { ResizeHandle, ResizeDirection } from '@mongodb-js/compass-components';
import { Resizable } from 're-resizable';

const ResizableSidebar = () => {
  return (
    <div style={{ display: 'flex', width: '800px', height: '400px' }}>
      <Resizable
        defaultSize={{
          width: '300px',
          height: '100%',
        }}
        minWidth="200px"
        maxWidth="500px"
        enable={{
          right: true,
        }}
        handleComponent={{
          right: (
            <ResizeHandle
              direction={ResizeDirection.RIGHT}
              value={300}
              minValue={200}
              maxValue={500}
              onChange={(value) => {}}
              title="sidebar"
            />
          ),
        }}
        handleStyles={{
          right: {
            right: '-9px',
          },
        }}
      >
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5' }}>
          <h3>Sidebar</h3>
          <p>This is a resizable sidebar panel.</p>
        </div>
      </Resizable>
      <div style={{ flex: 1, padding: '16px' }}>
        <h3>Main Content</h3>
        <p>This is the main content area.</p>
      </div>
    </div>
  );
};`,
      },
    },
  },
};
