import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TabNavBar } from './tab-nav-bar';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const meta = {
  title: 'Components/TabNavBar',
  component: TabNavBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    'aria-label': {
      control: 'text',
      description: 'Accessibility label for the tab navigation',
    },
    activeTabIndex: {
      control: 'number',
      description: 'Index of the currently active tab',
    },
    onTabClicked: {
      action: 'tab clicked',
      description: 'Callback when a tab is clicked',
    },
    tabs: {
      control: 'object',
      description: 'Array of tab objects with name, title, and content',
    },
  },
} satisfies Meta<typeof TabNavBar>;

export default meta;
type Story = StoryObj<typeof TabNavBar>;

/**
 * The TabNavBar component provides a tabbed interface with content that scrolls
 * when it overflows, while keeping the tabs in a fixed position.
 *
 * Features:
 * - Fixed tab navigation
 * - Scrollable content area
 * - Dark mode support
 * - Accessible tab navigation
 * - Customizable tab titles and content
 */

const containerStyles = css({
  width: '800px',
  height: '400px',
  border: '1px solid var(--leafygreen-ui-gray-light-2)',
  borderRadius: '6px',
  overflow: 'hidden',
});

const contentStyles = css({
  padding: spacing[3],
  height: '100%',
  overflow: 'auto',
});

const BasicExample = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const tabs = [
    {
      name: 'overview',
      title: 'Overview',
      content: (
        <div className={contentStyles}>
          <h2>Overview Content</h2>
          <p>This is the overview tab content.</p>
        </div>
      ),
    },
    {
      name: 'settings',
      title: 'Settings',
      content: (
        <div className={contentStyles}>
          <h2>Settings Content</h2>
          <p>This is the settings tab content.</p>
        </div>
      ),
    },
    {
      name: 'advanced',
      title: 'Advanced',
      content: (
        <div className={contentStyles}>
          <h2>Advanced Content</h2>
          <p>This is the advanced tab content.</p>
        </div>
      ),
    },
  ];

  return (
    <div className={containerStyles}>
      <TabNavBar
        aria-label="Example Tabs"
        activeTabIndex={activeTabIndex}
        onTabClicked={setActiveTabIndex}
        tabs={tabs}
      />
    </div>
  );
};
BasicExample.displayName = 'BasicExample';

const LongContentExample = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const tabs = [
    {
      name: 'short',
      title: 'Short Content',
      content: (
        <div className={contentStyles}>
          <h2>Short Content</h2>
          <p>This tab has minimal content.</p>
        </div>
      ),
    },
    {
      name: 'long',
      title: 'Long Content',
      content: (
        <div className={contentStyles}>
          <h2>Long Content</h2>
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i}>
              This is paragraph {i + 1} of a long scrollable content. The
              content area will scroll while the tabs remain fixed at the top.
            </p>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className={containerStyles}>
      <TabNavBar
        aria-label="Content Length Example"
        activeTabIndex={activeTabIndex}
        onTabClicked={setActiveTabIndex}
        tabs={tabs}
      />
    </div>
  );
};
LongContentExample.displayName = 'LongContentExample';

const CustomTitleExample = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const tabs = [
    {
      name: 'text',
      title: 'Text Tab',
      content: (
        <div className={contentStyles}>
          <h2>Text Tab Content</h2>
          <p>This tab has a simple text title.</p>
        </div>
      ),
    },
    {
      name: 'custom',
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <span>Custom Title</span>
          <span style={{ color: 'var(--leafygreen-ui-red-base)' }}>●</span>
        </div>
      ),
      content: (
        <div className={contentStyles}>
          <h2>Custom Title Content</h2>
          <p>This tab has a custom title with an icon.</p>
        </div>
      ),
    },
  ];

  return (
    <div className={containerStyles}>
      <TabNavBar
        aria-label="Custom Title Example"
        activeTabIndex={activeTabIndex}
        onTabClicked={setActiveTabIndex}
        tabs={tabs}
      />
    </div>
  );
};
CustomTitleExample.displayName = 'CustomTitleExample';

export const Basic: Story = {
  render: BasicExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic tab navigation with multiple tabs.',
      },
      source: {
        code: `
import { TabNavBar } from '@mongodb-js/compass-components';

function BasicTabs() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const tabs = [
    {
      name: 'overview',
      title: 'Overview',
      content: <div>Overview content</div>,
    },
    {
      name: 'settings',
      title: 'Settings',
      content: <div>Settings content</div>,
    },
    {
      name: 'advanced',
      title: 'Advanced',
      content: <div>Advanced content</div>,
    },
  ];

  return (
    <TabNavBar
      aria-label="Example Tabs"
      activeTabIndex={activeTabIndex}
      onTabClicked={setActiveTabIndex}
      tabs={tabs}
    />
  );
}`,
      },
    },
  },
};

export const LongContent: Story = {
  render: LongContentExample,
  parameters: {
    docs: {
      description: {
        story: 'Tab navigation with scrollable content area.',
      },
      source: {
        code: `
import { TabNavBar } from '@mongodb-js/compass-components';

function LongContentTabs() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const tabs = [
    {
      name: 'short',
      title: 'Short Content',
      content: <div>Short content</div>,
    },
    {
      name: 'long',
      title: 'Long Content',
      content: (
        <div>
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i}>Long scrollable content...</p>
          ))}
        </div>
      ),
    },
  ];

  return (
    <TabNavBar
      aria-label="Content Length Example"
      activeTabIndex={activeTabIndex}
      onTabClicked={setActiveTabIndex}
      tabs={tabs}
    />
  );
}`,
      },
    },
  },
};

export const CustomTitle: Story = {
  render: CustomTitleExample,
  parameters: {
    docs: {
      description: {
        story: 'Tab navigation with custom title elements.',
      },
      source: {
        code: `
import { TabNavBar } from '@mongodb-js/compass-components';

function CustomTitleTabs() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const tabs = [
    {
      name: 'text',
      title: 'Text Tab',
      content: <div>Text tab content</div>,
    },
    {
      name: 'custom',
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Custom Title</span>
          <span style={{ color: 'red' }}>●</span>
        </div>
      ),
      content: <div>Custom title content</div>,
    },
  ];

  return (
    <TabNavBar
      aria-label="Custom Title Example"
      activeTabIndex={activeTabIndex}
      onTabClicked={setActiveTabIndex}
      tabs={tabs}
    />
  );
}`,
      },
    },
  },
};
