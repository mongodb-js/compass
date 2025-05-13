import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Accordion } from './accordion';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'The text to display in the accordion header',
    },
    hintText: {
      control: 'text',
      description: 'Optional hint text to display next to the header text',
    },
    open: {
      control: 'boolean',
      description: 'Whether the accordion is open (controlled)',
    },
    setOpen: {
      action: 'opened',
      description: 'Function called when the accordion open state changes',
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof Accordion>;

/**
 * The Accordion component is a collapsible section that can be used to show and hide content.
 * It's commonly used to organize content into expandable sections.
 *
 * Features:
 * - Expandable/collapsible sections
 * - Optional hint text
 * - Controlled and uncontrolled modes
 * - Dark mode support
 * - Keyboard navigation
 * - ARIA attributes for accessibility
 */

const contentStyles = css({
  padding: spacing[3],
  backgroundColor: 'var(--leafygreen-ui-gray-light-3)',
  borderRadius: '6px',
  marginTop: spacing[2],
});

const BasicExample = () => {
  return (
    <div style={{ width: '400px' }}>
      <Accordion text="Basic Accordion">
        <div className={contentStyles}>
          <p>This is the content of the accordion.</p>
          <p>It can contain any React elements.</p>
        </div>
      </Accordion>
    </div>
  );
};
BasicExample.displayName = 'BasicExample';

const WithHintTextExample = () => {
  return (
    <div style={{ width: '400px' }}>
      <Accordion text="Accordion with Hint" hintText="(Optional)">
        <div className={contentStyles}>
          <p>This accordion includes a hint text next to the header.</p>
          <p>The hint text can be used to provide additional context.</p>
        </div>
      </Accordion>
    </div>
  );
};
WithHintTextExample.displayName = 'WithHintTextExample';

const ControlledExample = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ width: '400px' }}>
      <Accordion text="Controlled Accordion" open={open} setOpen={setOpen}>
        <div className={contentStyles}>
          <p>This is a controlled accordion.</p>
          <p>The open state is managed by the parent component.</p>
          <p>Current state: {open ? 'Open' : 'Closed'}</p>
        </div>
      </Accordion>
    </div>
  );
};
ControlledExample.displayName = 'ControlledExample';

const MultipleAccordionsExample = () => {
  return (
    <div style={{ width: '400px' }}>
      <Accordion text="First Section">
        <div className={contentStyles}>
          <p>This is the first section of content.</p>
        </div>
      </Accordion>
      <Accordion text="Second Section">
        <div className={contentStyles}>
          <p>This is the second section of content.</p>
        </div>
      </Accordion>
      <Accordion text="Third Section">
        <div className={contentStyles}>
          <p>This is the third section of content.</p>
        </div>
      </Accordion>
    </div>
  );
};
MultipleAccordionsExample.displayName = 'MultipleAccordionsExample';

export const Basic: Story = {
  render: BasicExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic accordion with simple content.',
      },
      source: {
        code: `
import { Accordion } from '@mongodb-js/compass-components';

function BasicAccordion() {
  return (
    <Accordion text="Basic Accordion">
      <div>
        <p>This is the content of the accordion.</p>
        <p>It can contain any React elements.</p>
      </div>
    </Accordion>
  );
}`,
      },
    },
  },
};

export const WithHintText: Story = {
  render: WithHintTextExample,
  parameters: {
    docs: {
      description: {
        story: 'Accordion with hint text next to the header.',
      },
      source: {
        code: `
import { Accordion } from '@mongodb-js/compass-components';

function AccordionWithHint() {
  return (
    <Accordion text="Accordion with Hint" hintText="(Optional)">
      <div>
        <p>This accordion includes a hint text next to the header.</p>
        <p>The hint text can be used to provide additional context.</p>
      </div>
    </Accordion>
  );
}`,
      },
    },
  },
};

export const Controlled: Story = {
  render: ControlledExample,
  parameters: {
    docs: {
      description: {
        story:
          'Controlled accordion where the open state is managed by the parent component.',
      },
      source: {
        code: `
import { Accordion } from '@mongodb-js/compass-components';

function ControlledAccordion() {
  const [open, setOpen] = React.useState(false);
  return (
    <Accordion text="Controlled Accordion" open={open} setOpen={setOpen}>
      <div>
        <p>This is a controlled accordion.</p>
        <p>The open state is managed by the parent component.</p>
        <p>Current state: {open ? 'Open' : 'Closed'}</p>
      </div>
    </Accordion>
  );
}`,
      },
    },
  },
};

export const MultipleAccordions: Story = {
  render: MultipleAccordionsExample,
  parameters: {
    docs: {
      description: {
        story:
          'Multiple accordions used together to create a sectioned interface.',
      },
      source: {
        code: `
import { Accordion } from '@mongodb-js/compass-components';

function MultipleAccordions() {
  return (
    <>
      <Accordion text="First Section">
        <div>
          <p>This is the first section of content.</p>
        </div>
      </Accordion>
      <Accordion text="Second Section">
        <div>
          <p>This is the second section of content.</p>
        </div>
      </Accordion>
      <Accordion text="Third Section">
        <div>
          <p>This is the third section of content.</p>
        </div>
      </Accordion>
    </>
  );
}`,
      },
    },
  },
};
