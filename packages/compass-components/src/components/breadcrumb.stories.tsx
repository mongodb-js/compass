import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './breadcrumb';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of breadcrumb items with name and onClick handler',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name for the breadcrumbs container',
    },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

/**
 * The Breadcrumbs component provides navigation context by showing the current location
 * in a hierarchical structure. It's commonly used in navigation bars and headers.
 *
 * Features:
 * - Hierarchical navigation display
 * - Clickable breadcrumb items
 * - Last item is non-clickable
 * - Dark mode support
 * - Truncation for long text
 * - Chevron separators
 */

const containerStyles = css({
  width: '600px',
  padding: spacing[3],
  backgroundColor: 'var(--leafygreen-ui-gray-light-3)',
  borderRadius: '6px',
});

const BasicExample = () => {
  const items = [
    { name: 'Home', onClick: () => noop() },
    { name: 'Databases', onClick: () => noop() },
    { name: 'myapp', onClick: () => noop() },
    { name: 'users', onClick: () => noop() },
  ];

  return (
    <div className={containerStyles}>
      <Breadcrumbs items={items} />
    </div>
  );
};
BasicExample.displayName = 'BasicExample';

const LongTextExample = () => {
  const items = [
    { name: 'Home', onClick: () => noop() },
    { name: 'Databases', onClick: () => noop() },
    { name: 'myapp', onClick: () => noop() },
    { name: 'users', onClick: () => noop() },
    {
      name: 'very-long-collection-name-that-should-be-truncated',
      onClick: () => noop(),
    },
  ];

  return (
    <div className={containerStyles}>
      <Breadcrumbs items={items} />
    </div>
  );
};
LongTextExample.displayName = 'LongTextExample';

const ShortPathExample = () => {
  const items = [
    { name: 'Home', onClick: () => noop() },
    { name: 'Databases', onClick: () => noop() },
  ];

  return (
    <div className={containerStyles}>
      <Breadcrumbs items={items} />
    </div>
  );
};
ShortPathExample.displayName = 'ShortPathExample';

const CustomStyledExample = () => {
  const items = [
    { name: 'Home', onClick: () => noop() },
    { name: 'Databases', onClick: () => noop() },
    { name: 'myapp', onClick: () => noop() },
    { name: 'users', onClick: () => noop() },
  ];

  const customStyles = css({
    backgroundColor: 'var(--leafygreen-ui-green-light-3)',
    padding: spacing[2],
    borderRadius: '4px',
  });

  return (
    <div className={containerStyles}>
      <Breadcrumbs items={items} className={customStyles} />
    </div>
  );
};
CustomStyledExample.displayName = 'CustomStyledExample';

export const Basic: Story = {
  render: BasicExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic breadcrumb navigation with multiple levels.',
      },
      source: {
        code: `
import { Breadcrumbs } from '@mongodb-js/compass-components';

function BasicBreadcrumbs() {
  const items = [
    { name: 'Home', onClick: () => noop() },
    { name: 'Databases', onClick: () => noop() },
    { name: 'myapp', onClick: () => noop() },
    { name: 'users', onClick: () => noop() },
  ];

  return <Breadcrumbs items={items} />;
}`,
      },
    },
  },
};

export const LongText: Story = {
  render: LongTextExample,
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with long text that gets truncated.',
      },
      source: {
        code: `
import { Breadcrumbs } from '@mongodb-js/compass-components';

function LongTextBreadcrumbs() {
  const items = [
    { name: 'Home', onClick: () => noop() },
    { name: 'Databases', onClick: () => noop() },
    { name: 'myapp', onClick: () => noop() },
    { name: 'users', onClick: () => noop() },
    { name: 'very-long-collection-name-that-should-be-truncated', onClick: () => noop() },
  ];

  return <Breadcrumbs items={items} />;
}`,
      },
    },
  },
};

export const ShortPath: Story = {
  render: ShortPathExample,
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with a short navigation path.',
      },
      source: {
        code: `
import { Breadcrumbs } from '@mongodb-js/compass-components';

function ShortPathBreadcrumbs() {
  const items = [
    { name: 'Home', onClick: () => noop() },
    { name: 'Databases', onClick: () => noop() },
  ];

  return <Breadcrumbs items={items} />;
}`,
      },
    },
  },
};

export const CustomStyled: Story = {
  render: CustomStyledExample,
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with custom styling applied.',
      },
      source: {
        code: `
import { Breadcrumbs } from '@mongodb-js/compass-components';
import { css } from '@leafygreen-ui/emotion';

function CustomStyledBreadcrumbs() {
  const items = [
    { name: 'Home', onClick: () => noop() },
    { name: 'Databases', onClick: () => noop() },
    { name: 'myapp', onClick: () => noop() },
    { name: 'users', onClick: () => noop() },
  ];

  const customStyles = css({
    backgroundColor: 'var(--leafygreen-ui-green-light-3)',
    padding: '8px',
    borderRadius: '4px',
  });

  return <Breadcrumbs items={items} className={customStyles} />;
}`,
      },
    },
  },
};
