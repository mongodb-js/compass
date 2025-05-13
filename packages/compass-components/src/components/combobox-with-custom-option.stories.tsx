import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ComboboxWithCustomOption } from './combobox-with-custom-option';
import { ComboboxOption } from './leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const meta: Meta<typeof ComboboxWithCustomOption> = {
  title: 'Components/Forms/ComboboxWithCustomOption',
  component: ComboboxWithCustomOption,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Array of options to display in the combobox',
    },
    value: {
      control: 'text',
      description: 'Currently selected value',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when value changes',
    },
    renderOption: {
      control: 'function',
      description: 'Function to render each option',
    },
    multiselect: {
      control: 'boolean',
      description: 'Whether multiple values can be selected',
    },
    label: {
      control: 'text',
      description: 'Label for the combobox',
    },
    description: {
      control: 'text',
      description: 'Description text for the combobox',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no value is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the combobox is disabled',
    },
    size: {
      control: 'select',
      options: ['default', 'small', 'xsmall'],
      description: 'Size of the combobox',
    },
    clearable: {
      control: 'boolean',
      description: 'Whether the selection can be cleared',
    },
    overflow: {
      control: 'select',
      options: ['scroll-x'],
      description: 'Overflow behavior',
    },
    searchState: {
      control: 'select',
      options: ['loading', 'error', 'unset'],
      description: 'State of the search',
    },
    searchLoadingMessage: {
      control: 'text',
      description: 'Message to show while loading',
    },
    searchErrorMessage: {
      control: 'text',
      description: 'Message to show on error',
    },
    searchEmptyMessage: {
      control: 'text',
      description: 'Message to show when no results',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComboboxWithCustomOption>;

const containerStyles = css`
  width: 300px;
  margin: ${spacing[4]}px;
`;

const BasicExample = () => {
  const [value, setValue] = React.useState<string | null>(null);
  const options = [
    { value: 'Option 1' },
    { value: 'Option 2' },
    { value: 'Option 3' },
  ];

  return (
    <div className={containerStyles}>
      <ComboboxWithCustomOption
        options={options}
        value={value}
        onChange={setValue}
        renderOption={(option, index, isCustom) => (
          <ComboboxOption
            key={index}
            value={option.value}
            displayName={isCustom ? `Custom: "${option.value}"` : option.value}
          />
        )}
        label="Select an option"
        placeholder="Choose an option"
        clearable={false}
        overflow="scroll-x"
      />
    </div>
  );
};
BasicExample.displayName = 'BasicExample';

const WithDescriptionExample = () => {
  const [value, setValue] = React.useState<string | null>(null);
  const options = [
    { value: 'Option 1' },
    { value: 'Option 2' },
    { value: 'Option 3' },
  ];

  return (
    <div className={containerStyles}>
      <ComboboxWithCustomOption
        options={options}
        value={value}
        onChange={setValue}
        renderOption={(option, index, isCustom) => (
          <ComboboxOption
            key={index}
            value={option.value}
            displayName={isCustom ? `Custom: "${option.value}"` : option.value}
          />
        )}
        label="Select an option"
        description="You can also type to create a custom option"
        placeholder="Choose an option"
        clearable={false}
        overflow="scroll-x"
      />
    </div>
  );
};
WithDescriptionExample.displayName = 'WithDescriptionExample';

const MultiselectExample = () => {
  const [value, setValue] = React.useState<string[]>([]);
  const options = [
    { value: 'Option 1' },
    { value: 'Option 2' },
    { value: 'Option 3' },
  ];

  return (
    <div className={containerStyles}>
      <ComboboxWithCustomOption
        options={options}
        value={value}
        onChange={setValue}
        renderOption={(option, index, isCustom) => (
          <ComboboxOption
            key={index}
            value={option.value}
            displayName={isCustom ? `Custom: "${option.value}"` : option.value}
          />
        )}
        label="Select options"
        description="You can select multiple options or create custom ones"
        placeholder="Choose options"
        multiselect
        clearable={false}
        overflow="scroll-x"
      />
    </div>
  );
};
MultiselectExample.displayName = 'MultiselectExample';

const LoadingExample = () => {
  const [value, setValue] = React.useState<string | null>(null);
  const options = [
    { value: 'Option 1' },
    { value: 'Option 2' },
    { value: 'Option 3' },
  ];

  return (
    <div className={containerStyles}>
      <ComboboxWithCustomOption
        options={options}
        value={value}
        onChange={setValue}
        renderOption={(option, index, isCustom) => (
          <ComboboxOption
            key={index}
            value={option.value}
            displayName={isCustom ? `Custom: "${option.value}"` : option.value}
          />
        )}
        label="Select an option"
        placeholder="Choose an option"
        clearable={false}
        overflow="scroll-x"
        searchState="loading"
        searchLoadingMessage="Loading options..."
      />
    </div>
  );
};
LoadingExample.displayName = 'LoadingExample';

export const Basic: Story = {
  render: BasicExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic combobox with custom option support.',
      },
      source: {
        code: `
import { ComboboxWithCustomOption, ComboboxOption } from '@mongodb-js/compass-components';

function BasicCombobox() {
  const [value, setValue] = React.useState(null);
  const options = [
    { value: 'Option 1' },
    { value: 'Option 2' },
    { value: 'Option 3' },
  ];

  return (
    <ComboboxWithCustomOption
      options={options}
      value={value}
      onChange={setValue}
      renderOption={(option, index, isCustom) => (
        <ComboboxOption
          key={index}
          value={option.value}
          displayName={isCustom ? \`Custom: "\${option.value}"\` : option.value}
        />
      )}
      label="Select an option"
      placeholder="Choose an option"
      clearable={false}
      overflow="scroll-x"
    />
  );
}`,
      },
    },
  },
};

export const WithDescription: Story = {
  render: WithDescriptionExample,
  parameters: {
    docs: {
      description: {
        story: 'Combobox with description text.',
      },
      source: {
        code: `
import { ComboboxWithCustomOption, ComboboxOption } from '@mongodb-js/compass-components';

function DescriptionCombobox() {
  const [value, setValue] = React.useState(null);
  const options = [
    { value: 'Option 1' },
    { value: 'Option 2' },
    { value: 'Option 3' },
  ];

  return (
    <ComboboxWithCustomOption
      options={options}
      value={value}
      onChange={setValue}
      renderOption={(option, index, isCustom) => (
        <ComboboxOption
          key={index}
          value={option.value}
          displayName={isCustom ? \`Custom: "\${option.value}"\` : option.value}
        />
      )}
      label="Select an option"
      description="You can also type to create a custom option"
      placeholder="Choose an option"
      clearable={false}
      overflow="scroll-x"
    />
  );
}`,
      },
    },
  },
};

export const Multiselect: Story = {
  render: MultiselectExample,
  parameters: {
    docs: {
      description: {
        story: 'Combobox with multiple selection support.',
      },
      source: {
        code: `
import { ComboboxWithCustomOption, ComboboxOption } from '@mongodb-js/compass-components';

function MultiselectCombobox() {
  const [value, setValue] = React.useState([]);
  const options = [
    { value: 'Option 1' },
    { value: 'Option 2' },
    { value: 'Option 3' },
  ];

  return (
    <ComboboxWithCustomOption
      options={options}
      value={value}
      onChange={setValue}
      renderOption={(option, index, isCustom) => (
        <ComboboxOption
          key={index}
          value={option.value}
          displayName={isCustom ? \`Custom: "\${option.value}"\` : option.value}
        />
      )}
      label="Select options"
      description="You can select multiple options or create custom ones"
      placeholder="Choose options"
      multiselect
      clearable={false}
      overflow="scroll-x"
    />
  );
}`,
      },
    },
  },
};

export const Loading: Story = {
  render: LoadingExample,
  parameters: {
    docs: {
      description: {
        story: 'Combobox in loading state.',
      },
      source: {
        code: `
import { ComboboxWithCustomOption, ComboboxOption } from '@mongodb-js/compass-components';

function LoadingCombobox() {
  const [value, setValue] = React.useState(null);
  const options = [
    { value: 'Option 1' },
    { value: 'Option 2' },
    { value: 'Option 3' },
  ];

  return (
    <ComboboxWithCustomOption
      options={options}
      value={value}
      onChange={setValue}
      renderOption={(option, index, isCustom) => (
        <ComboboxOption
          key={index}
          value={option.value}
          displayName={isCustom ? \`Custom: "\${option.value}"\` : option.value}
        />
      )}
      label="Select an option"
      placeholder="Choose an option"
      clearable={false}
      overflow="scroll-x"
      searchState="loading"
      searchLoadingMessage="Loading options..."
    />
  );
}`,
      },
    },
  },
};
