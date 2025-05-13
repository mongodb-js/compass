import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SelectList } from './select-list';

const meta = {
  title: 'Components/Forms/SelectList',
  component: SelectList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'The list of items to display in the select list',
    },
    label: {
      control: 'object',
      description: 'Label configuration for the select list',
    },
    onChange: {
      action: 'changed',
      description: 'Function called when selection changes',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select list is disabled',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name',
    },
  },
} satisfies Meta<typeof SelectList>;

export default meta;
type Story = StoryObj<typeof SelectList>;

/**
 * The SelectList component allows users to select multiple items from a list.
 * It includes a "Select All" checkbox at the top that can select or deselect all items.
 *
 * Features:
 * - Multiple selection with checkboxes
 * - "Select All" functionality
 * - Support for custom display labels and aria labels
 * - Indeterminate checkbox state when some items are selected
 * - Dark mode support
 * - Disabled state
 */

type SelectItem = {
  id: string;
  selected: boolean;
  name: string;
};

const DefaultExample = () => {
  const [items, setItems] = React.useState<SelectItem[]>([
    { id: '1', selected: false, name: 'Item 1' },
    { id: '2', selected: false, name: 'Item 2' },
    { id: '3', selected: false, name: 'Item 3' },
  ]);

  const handleChange = (newItems: SelectItem[]) => {
    setItems(newItems);
  };

  return (
    <div style={{ width: '300px' }}>
      <SelectList
        items={items}
        label={{
          displayLabelKey: 'name',
          name: 'Select Items',
        }}
        onChange={handleChange}
      />
    </div>
  );
};
DefaultExample.displayName = 'DefaultExample';

const WithSelectedItemsExample = () => {
  const [items, setItems] = React.useState<SelectItem[]>([
    { id: '1', selected: true, name: 'Item 1' },
    { id: '2', selected: false, name: 'Item 2' },
    { id: '3', selected: true, name: 'Item 3' },
  ]);

  const handleChange = (newItems: SelectItem[]) => {
    setItems(newItems);
  };

  return (
    <div style={{ width: '300px' }}>
      <SelectList
        items={items}
        label={{
          displayLabelKey: 'name',
          name: 'Select Items',
        }}
        onChange={handleChange}
      />
    </div>
  );
};
WithSelectedItemsExample.displayName = 'WithSelectedItemsExample';

const DisabledExample = () => {
  const [items, setItems] = React.useState<SelectItem[]>([
    { id: '1', selected: true, name: 'Item 1' },
    { id: '2', selected: false, name: 'Item 2' },
    { id: '3', selected: true, name: 'Item 3' },
  ]);

  const handleChange = (newItems: SelectItem[]) => {
    setItems(newItems);
  };

  return (
    <div style={{ width: '300px' }}>
      <SelectList
        items={items}
        label={{
          displayLabelKey: 'name',
          name: 'Select Items',
        }}
        onChange={handleChange}
        disabled={true}
      />
    </div>
  );
};
DisabledExample.displayName = 'DisabledExample';

const CustomAriaLabelsExample = () => {
  type ItemWithAriaLabel = SelectItem & { ariaLabel: string };

  const [items, setItems] = React.useState<ItemWithAriaLabel[]>([
    { id: '1', selected: false, name: 'Item 1', ariaLabel: 'First Item' },
    { id: '2', selected: false, name: 'Item 2', ariaLabel: 'Second Item' },
    { id: '3', selected: false, name: 'Item 3', ariaLabel: 'Third Item' },
  ]);

  const handleChange = (newItems: ItemWithAriaLabel[]) => {
    setItems(newItems);
  };

  return (
    <div style={{ width: '300px' }}>
      <SelectList
        items={items}
        label={{
          displayLabelKey: 'name',
          ariaLabelKey: 'ariaLabel',
          name: 'Select Items',
        }}
        onChange={handleChange}
      />
    </div>
  );
};
CustomAriaLabelsExample.displayName = 'CustomAriaLabelsExample';

export const Default: Story = {
  render: DefaultExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic select list with unselected items.',
      },
      source: {
        code: `
import { SelectList } from '@mongodb-js/compass-components';

function SelectListExample() {
  const [items, setItems] = React.useState([
    { id: '1', selected: false, name: 'Item 1' },
    { id: '2', selected: false, name: 'Item 2' },
    { id: '3', selected: false, name: 'Item 3' },
  ]);

  const handleChange = (newItems) => {
    setItems(newItems);
  };

  return (
    <SelectList
      items={items}
      label={{
        displayLabelKey: 'name',
        name: 'Select Items',
      }}
      onChange={handleChange}
    />
  );
}`,
      },
    },
  },
};

export const WithSelectedItems: Story = {
  render: WithSelectedItemsExample,
  parameters: {
    docs: {
      description: {
        story: 'Select list with some pre-selected items.',
      },
      source: {
        code: `
import { SelectList } from '@mongodb-js/compass-components';

function SelectListWithSelectedItems() {
  const [items, setItems] = React.useState([
    { id: '1', selected: true, name: 'Item 1' },
    { id: '2', selected: false, name: 'Item 2' },
    { id: '3', selected: true, name: 'Item 3' },
  ]);

  const handleChange = (newItems) => {
    setItems(newItems);
  };

  return (
    <SelectList
      items={items}
      label={{
        displayLabelKey: 'name',
        name: 'Select Items',
      }}
      onChange={handleChange}
    />
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
        story: 'Disabled select list where selections cannot be changed.',
      },
      source: {
        code: `
import { SelectList } from '@mongodb-js/compass-components';

function DisabledSelectList() {
  const [items, setItems] = React.useState([
    { id: '1', selected: true, name: 'Item 1' },
    { id: '2', selected: false, name: 'Item 2' },
    { id: '3', selected: true, name: 'Item 3' },
  ]);

  const handleChange = (newItems) => {
    setItems(newItems);
  };

  return (
    <SelectList
      items={items}
      label={{
        displayLabelKey: 'name',
        name: 'Select Items',
      }}
      onChange={handleChange}
      disabled={true}
    />
  );
}`,
      },
    },
  },
};

export const WithCustomAriaLabels: Story = {
  render: CustomAriaLabelsExample,
  parameters: {
    docs: {
      description: {
        story:
          'Select list with custom ARIA labels for improved accessibility.',
      },
      source: {
        code: `
import { SelectList } from '@mongodb-js/compass-components';

function SelectListWithAriaLabels() {
  const [items, setItems] = React.useState([
    { id: '1', selected: false, name: 'Item 1', ariaLabel: 'First Item' },
    { id: '2', selected: false, name: 'Item 2', ariaLabel: 'Second Item' },
    { id: '3', selected: false, name: 'Item 3', ariaLabel: 'Third Item' },
  ]);

  const handleChange = (newItems) => {
    setItems(newItems);
  };

  return (
    <SelectList
      items={items}
      label={{
        displayLabelKey: 'name',
        ariaLabelKey: 'ariaLabel',
        name: 'Select Items',
      }}
      onChange={handleChange}
    />
  );
}`,
      },
    },
  },
};
