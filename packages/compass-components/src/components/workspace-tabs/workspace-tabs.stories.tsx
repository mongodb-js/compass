import type { Meta, StoryObj } from '@storybook/react';
import { WorkspaceTabs, type TabProps } from './workspace-tabs';

const meta = {
  title: 'Components/WorkspaceTabs',
  component: WorkspaceTabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'ARIA label for the tabs container',
    },
    onCreateNewTab: {
      action: 'created',
      description: 'Function called when creating a new tab',
    },
    onSelectTab: {
      action: 'selected',
      description: 'Function called when selecting a tab',
    },
    onSelectNextTab: {
      action: 'next',
      description: 'Function called when selecting the next tab',
    },
    onSelectPrevTab: {
      action: 'prev',
      description: 'Function called when selecting the previous tab',
    },
    onCloseTab: {
      action: 'closed',
      description: 'Function called when closing a tab',
    },
    onMoveTab: {
      action: 'moved',
      description: 'Function called when moving a tab',
    },
  },
} satisfies Meta<typeof WorkspaceTabs>;

export default meta;
type Story = StoryObj<typeof WorkspaceTabs>;

/**
 * The WorkspaceTabs component is a tabbed interface for managing multiple workspaces.
 * It supports drag-and-drop reordering, keyboard navigation, and tab management.
 *
 * Features:
 * - Multiple tabs with icons and titles
 * - Drag-and-drop reordering
 * - Keyboard navigation
 * - Tab creation and closing
 * - Dark mode support
 * - Tooltips for tab information
 */

const defaultTabs: TabProps[] = [
  {
    id: 'tab1',
    type: 'connection',
    title: 'Local Connection',
    iconGlyph: 'Server',
    tooltip: [['Connection', 'mongodb://localhost:27017']],
  },
  {
    id: 'tab2',
    type: 'collection',
    title: 'Users Collection',
    iconGlyph: 'Database',
    tooltip: [
      ['Database', 'myapp'],
      ['Collection', 'users'],
    ],
  },
  {
    id: 'tab3',
    type: 'query',
    title: 'Find Users',
    iconGlyph: 'Code',
    tooltip: [['Query', 'db.users.find()']],
  },
];

export const Default: Story = {
  args: {
    'aria-label': 'Workspace Tabs',
    tabs: defaultTabs,
    selectedTabIndex: 0,
  },
};

export const WithManyTabs: Story = {
  args: {
    'aria-label': 'Workspace Tabs',
    tabs: [
      ...defaultTabs,
      {
        id: 'tab4',
        type: 'connection',
        title: 'Atlas Cluster',
        iconGlyph: 'Server',
        tooltip: [['Connection', 'mongodb+srv://...']],
      },
      {
        id: 'tab5',
        type: 'collection',
        title: 'Products Collection',
        iconGlyph: 'Database',
        tooltip: [
          ['Database', 'shop'],
          ['Collection', 'products'],
        ],
      },
      {
        id: 'tab6',
        type: 'query',
        title: 'Aggregate Products',
        iconGlyph: 'Code',
        tooltip: [['Query', 'db.products.aggregate([...])']],
      },
    ],
    selectedTabIndex: 0,
  },
};

export const WithSelectedTab: Story = {
  args: {
    'aria-label': 'Workspace Tabs',
    tabs: defaultTabs,
    selectedTabIndex: 1,
  },
};

export const WithLongTitles: Story = {
  args: {
    'aria-label': 'Workspace Tabs',
    tabs: [
      {
        id: 'tab1',
        type: 'connection',
        title: 'Very Long Connection Name That Might Not Fit',
        iconGlyph: 'Server',
        tooltip: [['Connection', 'mongodb://localhost:27017']],
      },
      {
        id: 'tab2',
        type: 'collection',
        title: 'Another Very Long Collection Name That Might Not Fit',
        iconGlyph: 'Database',
        tooltip: [
          ['Database', 'myapp'],
          ['Collection', 'users'],
        ],
      },
    ],
    selectedTabIndex: 0,
  },
};
