import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import ResizableSidebar, { defaultSidebarWidth } from './resizeable-sidebar';

const meta: Meta<typeof ResizableSidebar> = {
  title: 'Components/ResizableSidebar',
  component: ResizableSidebar,
  argTypes: {
    initialWidth: {
      control: { type: 'number' },
      description: 'Initial width of the sidebar',
      defaultValue: defaultSidebarWidth,
    },
    minWidth: {
      control: { type: 'number' },
      description: 'Minimum width of the sidebar',
      defaultValue: 210,
    },
    useNewTheme: {
      control: { type: 'boolean' },
      description: 'Whether to use the new theme styles',
      defaultValue: false,
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

type Story = StoryObj<typeof ResizableSidebar>;

// Demo component with text content for visualization
const SidebarContent = ({ title }: { title: string }) => (
  <div style={{ padding: '20px' }}>
    <h3>{title}</h3>
    <p>
      This is a resizable sidebar component. Try dragging the right edge to
      resize.
    </p>
    <ul>
      <li>Menu Item 1</li>
      <li>Menu Item 2</li>
      <li>Menu Item 3</li>
      <li>Menu Item 4</li>
    </ul>
  </div>
);

export const Default: Story = {
  render: (args) => (
    <div style={{ height: '400px', display: 'flex', border: '1px solid #ccc' }}>
      <ResizableSidebar {...args}>
        <SidebarContent title="Default Sidebar" />
      </ResizableSidebar>
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Main Content Area</h2>
        <p>
          This is the main content area that will resize as the sidebar is
          resized.
        </p>
      </div>
    </div>
  ),
};

export const WithNewTheme: Story = {
  render: (args) => (
    <div style={{ height: '400px', display: 'flex', border: '1px solid #ccc' }}>
      <ResizableSidebar {...args} useNewTheme={true}>
        <SidebarContent title="New Theme Sidebar" />
      </ResizableSidebar>
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Main Content Area</h2>
        <p>This sidebar uses the new theme option.</p>
      </div>
    </div>
  ),
};

export const CustomWidth: Story = {
  render: (args) => (
    <div style={{ height: '400px', display: 'flex', border: '1px solid #ccc' }}>
      <ResizableSidebar {...args} initialWidth={400} minWidth={250}>
        <SidebarContent title="Custom Width Sidebar" />
      </ResizableSidebar>
      <div style={{ flex: 1, padding: '20px' }}>
        <h2>Main Content Area</h2>
        <p>
          This sidebar has a custom initial width of 400px and a minimum width
          of 250px.
        </p>
      </div>
    </div>
  ),
};
