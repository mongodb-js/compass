import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ListEditor } from './list-editor';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const meta: Meta<typeof ListEditor> = {
  title: 'Components/Forms/ListEditor',
  component: ListEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of items to display in the list',
    },
    onAddItem: {
      action: 'added',
      description: 'Callback when add button is clicked',
    },
    onRemoveItem: {
      action: 'removed',
      description: 'Callback when remove button is clicked',
    },
    renderItem: {
      control: 'function',
      description: 'Function to render each item',
    },
    disableAddButton: {
      control: 'function',
      description: 'Function that defines when the add button is disabled',
    },
    disableRemoveButton: {
      control: 'function',
      description: 'Function that defines when the remove button is disabled',
    },
    addButtonTestId: {
      control: 'text',
      description: 'Test ID for the add button',
    },
    removeButtonTestId: {
      control: 'text',
      description: 'Test ID for the remove button',
    },
    itemTestId: {
      control: 'function',
      description: 'Function that returns test ID for each item',
    },
    itemKey: {
      control: 'function',
      description: 'Function that returns key for each item',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ListEditor>;

const itemStyles = css`
  padding: ${spacing[2]}px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: ${spacing[2]}px;
`;

const BasicExample = () => {
  const [items, setItems] = React.useState(['Item 1', 'Item 2']);

  return (
    <div style={{ width: '400px' }}>
      <ListEditor
        items={items}
        onAddItem={() => setItems([...items, `Item ${items.length + 1}`])}
        onRemoveItem={(index) => setItems(items.filter((_, i) => i !== index))}
        renderItem={(item) => <div className={itemStyles}>{item}</div>}
      />
    </div>
  );
};
BasicExample.displayName = 'BasicExample';

const CustomTestIdsExample = () => {
  const [items, setItems] = React.useState(['Item 1', 'Item 2']);

  return (
    <div style={{ width: '400px' }}>
      <ListEditor
        items={items}
        onAddItem={() => setItems([...items, `Item ${items.length + 1}`])}
        onRemoveItem={(index) => setItems(items.filter((_, i) => i !== index))}
        renderItem={(item) => <div className={itemStyles}>{item}</div>}
        addButtonTestId="custom-add-button"
        removeButtonTestId="custom-remove-button"
        itemTestId={(index) => `custom-item-${index}`}
      />
    </div>
  );
};
CustomTestIdsExample.displayName = 'CustomTestIdsExample';

const DisabledButtonsExample = () => {
  const [items, setItems] = React.useState(['Item 1', 'Item 2']);

  return (
    <div style={{ width: '400px' }}>
      <ListEditor
        items={items}
        onAddItem={() => setItems([...items, `Item ${items.length + 1}`])}
        onRemoveItem={(index) => setItems(items.filter((_, i) => i !== index))}
        renderItem={(item) => <div className={itemStyles}>{item}</div>}
        disableAddButton={() => true}
        disableRemoveButton={() => true}
      />
    </div>
  );
};
DisabledButtonsExample.displayName = 'DisabledButtonsExample';

export const Basic: Story = {
  render: BasicExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic list editor with default settings.',
      },
      source: {
        code: `
import { ListEditor } from '@mongodb-js/compass-components';

function BasicListEditor() {
  const [items, setItems] = React.useState(['Item 1', 'Item 2']);

  return (
    <ListEditor
      items={items}
      onAddItem={() => setItems([...items, \`Item \${items.length + 1}\`])}
      onRemoveItem={(index) => setItems(items.filter((_, i) => i !== index))}
      renderItem={(item) => <div>{item}</div>}
    />
  );
}`,
      },
    },
  },
};

export const CustomTestIds: Story = {
  render: CustomTestIdsExample,
  parameters: {
    docs: {
      description: {
        story: 'List editor with custom test IDs for buttons and items.',
      },
      source: {
        code: `
import { ListEditor } from '@mongodb-js/compass-components';

function CustomTestIdsListEditor() {
  const [items, setItems] = React.useState(['Item 1', 'Item 2']);

  return (
    <ListEditor
      items={items}
      onAddItem={() => setItems([...items, \`Item \${items.length + 1}\`])}
      onRemoveItem={(index) => setItems(items.filter((_, i) => i !== index))}
      renderItem={(item) => <div>{item}</div>}
      addButtonTestId="custom-add-button"
      removeButtonTestId="custom-remove-button"
      itemTestId={(index) => \`custom-item-\${index}\`}
    />
  );
}`,
      },
    },
  },
};

export const DisabledButtons: Story = {
  render: DisabledButtonsExample,
  parameters: {
    docs: {
      description: {
        story: 'List editor with disabled add and remove buttons.',
      },
      source: {
        code: `
import { ListEditor } from '@mongodb-js/compass-components';

function DisabledButtonsListEditor() {
  const [items, setItems] = React.useState(['Item 1', 'Item 2']);

  return (
    <ListEditor
      items={items}
      onAddItem={() => setItems([...items, \`Item \${items.length + 1}\`])}
      onRemoveItem={(index) => setItems(items.filter((_, i) => i !== index))}
      renderItem={(item) => <div>{item}</div>}
      disableAddButton={() => true}
      disableRemoveButton={() => true}
    />
  );
}`,
      },
    },
  },
};
