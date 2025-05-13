import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  SignalPopover,
  SignalHooksProvider,
  type Signal,
} from './signal-popover';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const meta = {
  title: 'Components/SignalPopover',
  component: SignalPopover,
  parameters: {
    controls: { expanded: true },
  },
  tags: ['autodocs'],
  argTypes: {
    signals: {
      description: 'The signal(s) to display in the popover',
    },
    darkMode: {
      control: 'boolean',
      description: 'Whether to use dark mode styles',
    },
    onPopoverOpenChange: {
      description: 'Callback when popover open state changes',
    },
    shouldExpandBadge: {
      control: 'boolean',
      description: 'Whether the badge should always be expanded',
    },
  },
} satisfies Meta<typeof SignalPopover>;

export default meta;
type Story = StoryObj<typeof SignalPopover>;

const containerStyles = css({
  padding: spacing[400],
  display: 'flex',
  alignItems: 'center',
  gap: spacing[300],
});

const singleSignal: Signal = {
  id: 'single-signal-example',
  title: 'Performance optimization suggestion',
  description:
    'This query could be optimized by adding an index on the fields being queried.',
  learnMoreLink: 'https://www.mongodb.com/docs/manual/indexes/',
  primaryActionButtonLabel: 'Create index',
  primaryActionButtonIcon: 'Plus',
};

const multipleSignals: Signal[] = [
  {
    id: 'signal-1',
    title: 'Query executed without index',
    description:
      'This query ran without an index. If you plan on using this query heavily in your application, you should create an index that covers this query.',
    learnMoreLink:
      'https://www.mongodb.com/docs/v6.0/core/data-model-operations/#indexes',
    primaryActionButtonLabel: 'Create index',
    primaryActionButtonIcon: 'Plus',
  },
  {
    id: 'signal-2',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Convert your query to $search for a wider range of functionality.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    primaryActionButtonLabel: 'Create Search Index',
  },
  {
    id: 'signal-3',
    title: '$lookup usage',
    description:
      '$lookup operations can be resource-intensive because they perform operations on two collections instead of one. In certain situations, embedding documents or arrays can enhance read performance.',
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/schema-suggestions/reduce-lookup-operations/#std-label-anti-pattern-denormalization',
  },
];

/**
 * SignalPopover with tracking via SignalHooksProvider to monitor and log interactions with signals.
 */
export const Basic: Story = {
  render: () => {
    const handleSignalMount = (id: string) => {
      console.log(`Signal mounted: ${id}`);
    };

    const handleSignalOpen = (id: string) => {
      console.log(`Signal opened: ${id}`);
    };

    const handleSignalLinkClick = (id: string) => {
      console.log(`Signal link clicked: ${id}`);
    };

    const handleSignalPrimaryActionClick = (id: string) => {
      console.log(`Signal primary action clicked: ${id}`);
    };

    const handleSignalClose = (id: string) => {
      console.log(`Signal closed: ${id}`);
    };

    return (
      <SignalHooksProvider
        onSignalMount={handleSignalMount}
        onSignalOpen={handleSignalOpen}
        onSignalLinkClick={handleSignalLinkClick}
        onSignalPrimaryActionClick={handleSignalPrimaryActionClick}
        onSignalClose={handleSignalClose}
      >
        <div className={containerStyles}>
          <div>
            <h3>Single Signal</h3>
            <SignalPopover signals={singleSignal} />
          </div>

          <div>
            <h3>Multiple Signals</h3>
            <SignalPopover signals={multipleSignals} />
          </div>
        </div>
      </SignalHooksProvider>
    );
  },
};

/**
 * SignalPopover displaying a single signal/insight.
 */
export const SingleSignal: Story = {
  args: {
    signals: singleSignal,
  },
  render: (args) => (
    <div className={containerStyles}>
      <SignalPopover {...args} />
    </div>
  ),
};

/**
 * SignalPopover displaying multiple signals that can be navigated between.
 */
export const MultipleSignals: Story = {
  args: {
    signals: multipleSignals,
  },
  render: (args) => (
    <div className={containerStyles}>
      <SignalPopover {...args} />
    </div>
  ),
};

/**
 * SignalPopover with badge always expanded rather than only on hover/focus.
 */
export const ExpandedBadge: Story = {
  render: () => (
    <div className={containerStyles}>
      <div>
        <h3>Single Signal</h3>
        <SignalPopover signals={singleSignal} shouldExpandBadge={true} />
      </div>

      <div>
        <h3>Multiple Signals</h3>
        <SignalPopover signals={multipleSignals} shouldExpandBadge={true} />
      </div>
    </div>
  ),
};

/**
 * SignalPopover in dark mode, showing how it adapts to dark themes.
 */
export const DarkMode: Story = {
  render: () => (
    <div
      className={containerStyles}
      style={{ backgroundColor: '#333', color: 'white' }}
    >
      <div>
        <h3>Single Signal</h3>
        <SignalPopover signals={singleSignal} darkMode={true} />
      </div>

      <div>
        <h3>Multiple Signals</h3>
        <SignalPopover signals={multipleSignals} darkMode={true} />
      </div>
    </div>
  ),
};
