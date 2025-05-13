import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OptionsToggle } from './options-toggle';

const meta: Meta<typeof OptionsToggle> = {
  title: 'Components/Forms/OptionsToggle',
  component: OptionsToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isExpanded: {
      control: 'boolean',
      description: 'Whether the options are expanded',
    },
    onToggleOptions: {
      action: 'toggled',
      description: 'Callback when toggle is clicked',
    },
    label: {
      control: 'function',
      description:
        'Function that returns the label text based on expanded state',
    },
    'aria-label': {
      control: 'function',
      description:
        'Function that returns the aria-label based on expanded state',
    },
    'aria-controls': {
      control: 'text',
      description: 'ID of the element controlled by this toggle',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OptionsToggle>;

const BasicExample = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div style={{ width: '200px' }}>
      <OptionsToggle
        isExpanded={isExpanded}
        onToggleOptions={() => setIsExpanded(!isExpanded)}
        aria-controls="options-content"
      />
      {isExpanded && (
        <div id="options-content" style={{ marginTop: '8px' }}>
          Additional options content goes here
        </div>
      )}
    </div>
  );
};
BasicExample.displayName = 'BasicExample';

const CustomLabelsExample = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div style={{ width: '200px' }}>
      <OptionsToggle
        isExpanded={isExpanded}
        onToggleOptions={() => setIsExpanded(!isExpanded)}
        aria-controls="custom-options-content"
        label={(expanded) => (expanded ? 'Show Less' : 'Show More')}
        aria-label={(expanded) =>
          expanded ? 'Collapse additional options' : 'Expand additional options'
        }
      />
      {isExpanded && (
        <div id="custom-options-content" style={{ marginTop: '8px' }}>
          Additional options content goes here
        </div>
      )}
    </div>
  );
};
CustomLabelsExample.displayName = 'CustomLabelsExample';

export const Basic: Story = {
  render: BasicExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic options toggle with default labels.',
      },
      source: {
        code: `
import { OptionsToggle } from '@mongodb-js/compass-components';

function BasicOptionsToggle() {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div>
      <OptionsToggle
        isExpanded={isExpanded}
        onToggleOptions={() => setIsExpanded(!isExpanded)}
        aria-controls="options-content"
      />
      {isExpanded && (
        <div id="options-content">
          Additional options content goes here
        </div>
      )}
    </div>
  );
}`,
      },
    },
  },
};

export const CustomLabels: Story = {
  render: CustomLabelsExample,
  parameters: {
    docs: {
      description: {
        story:
          'Options toggle with custom labels for expanded and collapsed states.',
      },
      source: {
        code: `
import { OptionsToggle } from '@mongodb-js/compass-components';

function CustomLabelsOptionsToggle() {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div>
      <OptionsToggle
        isExpanded={isExpanded}
        onToggleOptions={() => setIsExpanded(!isExpanded)}
        aria-controls="custom-options-content"
        label={(expanded) => (expanded ? 'Show Less' : 'Show More')}
        aria-label={(expanded) =>
          expanded ? 'Collapse additional options' : 'Expand additional options'
        }
      />
      {isExpanded && (
        <div id="custom-options-content">
          Additional options content goes here
        </div>
      )}
    </div>
  );
}`,
      },
    },
  },
};
