import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RadioBoxGroup } from './radio-box-group';
import { RadioBox } from './leafygreen';

const meta: Meta<typeof RadioBoxGroup> = {
  title: 'Components/Forms/RadioBoxGroup',
  component: RadioBoxGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: {
      action: 'changed',
      description: 'Callback when selection changes',
    },
    value: {
      control: 'text',
      description: 'Currently selected value',
    },
    name: {
      control: 'text',
      description: 'Name attribute for the radio group',
    },
    size: {
      control: 'select',
      options: ['default', 'compact'],
      description: 'Size variant of the radio boxes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioBoxGroup>;

const BasicExample = () => {
  const [value, setValue] = React.useState('option1');

  return (
    <RadioBoxGroup
      value={value}
      onChange={(e) => setValue(e.target.value)}
      name="basic-example"
    >
      <RadioBox value="option1">Option 1</RadioBox>
      <RadioBox value="option2">Option 2</RadioBox>
      <RadioBox value="option3">Option 3</RadioBox>
    </RadioBoxGroup>
  );
};
BasicExample.displayName = 'BasicExample';

const CompactExample = () => {
  const [value, setValue] = React.useState('option1');

  return (
    <RadioBoxGroup
      value={value}
      onChange={(e) => setValue(e.target.value)}
      name="compact-example"
      size="compact"
    >
      <RadioBox value="option1">Option 1</RadioBox>
      <RadioBox value="option2">Option 2</RadioBox>
      <RadioBox value="option3">Option 3</RadioBox>
    </RadioBoxGroup>
  );
};
CompactExample.displayName = 'CompactExample';

const DisabledExample = () => {
  const [value, setValue] = React.useState('option1');

  return (
    <RadioBoxGroup
      value={value}
      onChange={(e) => setValue(e.target.value)}
      name="disabled-example"
    >
      <RadioBox value="option1">Option 1</RadioBox>
      <RadioBox value="option2" disabled>
        Option 2 (Disabled)
      </RadioBox>
      <RadioBox value="option3">Option 3</RadioBox>
    </RadioBoxGroup>
  );
};
DisabledExample.displayName = 'DisabledExample';

export const Basic: Story = {
  render: BasicExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic radio box group with three options.',
      },
      source: {
        code: `
import { RadioBoxGroup, RadioBox } from '@mongodb-js/compass-components';

function BasicRadioGroup() {
  const [value, setValue] = React.useState('option1');

  return (
    <RadioBoxGroup
      value={value}
      onChange={(e) => setValue(e.target.value)}
      name="basic-example"
    >
      <RadioBox value="option1">Option 1</RadioBox>
      <RadioBox value="option2">Option 2</RadioBox>
      <RadioBox value="option3">Option 3</RadioBox>
    </RadioBoxGroup>
  );
}`,
      },
    },
  },
};

export const Compact: Story = {
  render: CompactExample,
  parameters: {
    docs: {
      description: {
        story: 'Radio box group with compact size variant.',
      },
      source: {
        code: `
import { RadioBoxGroup, RadioBox } from '@mongodb-js/compass-components';

function CompactRadioGroup() {
  const [value, setValue] = React.useState('option1');

  return (
    <RadioBoxGroup
      value={value}
      onChange={(e) => setValue(e.target.value)}
      name="compact-example"
      size="compact"
    >
      <RadioBox value="option1">Option 1</RadioBox>
      <RadioBox value="option2">Option 2</RadioBox>
      <RadioBox value="option3">Option 3</RadioBox>
    </RadioBoxGroup>
  );
}`,
      },
    },
  },
};

export const Disabled: Story = {
  render: DisabledExample,
  parameters: {
    docs: {
      description: {
        story: 'Radio box group with a disabled option.',
      },
      source: {
        code: `
import { RadioBoxGroup, RadioBox } from '@mongodb-js/compass-components';

function DisabledRadioGroup() {
  const [value, setValue] = React.useState('option1');

  return (
    <RadioBoxGroup
      value={value}
      onChange={(e) => setValue(e.target.value)}
      name="disabled-example"
    >
      <RadioBox value="option1">Option 1</RadioBox>
      <RadioBox value="option2" disabled>
        Option 2 (Disabled)
      </RadioBox>
      <RadioBox value="option3">Option 3</RadioBox>
    </RadioBoxGroup>
  );
}`,
      },
    },
  },
};
