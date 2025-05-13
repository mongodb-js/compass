import type { Meta, StoryObj } from '@storybook/react';
import BSONValue from './bson-value';
import {
  ObjectId as BSONObjectId,
  Binary as BSONBinary,
  DBRef as BSONDBRef,
  Timestamp as BSONTimestamp,
  Int32,
} from 'bson';

const meta = {
  title: 'Components/BSONValue',
  component: BSONValue,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: [
        'String',
        'Int32',
        'Double',
        'ObjectId',
        'Date',
        'Boolean',
        'Array',
        'Object',
        'Binary',
        'DBRef',
        'Timestamp',
        'MinKey',
        'MaxKey',
      ],
      description: 'The BSON type of the value',
    },
    value: {
      control: 'object',
      description: 'The value to display',
    },
  },
} satisfies Meta<typeof BSONValue>;

export default meta;
type Story = StoryObj<typeof BSONValue>;

/**
 * The BSONValue component is used to display MongoDB BSON values with proper formatting and type information.
 * It supports all BSON types and provides appropriate styling and formatting for each type.
 *
 * Features:
 * - Type-specific formatting and styling
 * - Truncation for long values
 * - Special handling for encrypted values
 * - Support for all BSON types including complex types like ObjectId, Binary, and DBRef
 * - Dark mode support
 */

export const String: Story = {
  args: {
    type: 'String',
    value: 'Hello, MongoDB!',
  },
};

export const Number: Story = {
  args: {
    type: 'Int32',
    value: new Int32(42),
  },
};

export const ObjectId: Story = {
  args: {
    type: 'ObjectId',
    value: new BSONObjectId(),
  },
};

export const DateValue: Story = {
  args: {
    type: 'Date',
    value: new Date(),
  },
};

export const Boolean: Story = {
  args: {
    type: 'Boolean',
    value: true,
  },
};

export const Array: Story = {
  args: {
    type: 'Array',
    value: [1, 2, 3, 'four', { five: 5 }],
  },
};

export const Object: Story = {
  args: {
    type: 'Object',
    value: { name: 'MongoDB', version: '6.0' },
  },
};

export const Binary: Story = {
  args: {
    type: 'Binary',
    value: new BSONBinary(Buffer.from('Hello, Binary!')),
  },
};

export const EncryptedBinary: Story = {
  args: {
    type: 'Binary',
    value: new BSONBinary(
      Buffer.from('encrypted data'),
      BSONBinary.SUBTYPE_ENCRYPTED
    ),
  },
};

export const DBRef: Story = {
  args: {
    type: 'DBRef',
    value: new BSONDBRef('collection', new BSONObjectId()),
  },
};

export const Timestamp: Story = {
  args: {
    type: 'Timestamp',
    value: new BSONTimestamp({ t: 0, i: 0 }),
  },
};

export const MinKey: Story = {
  args: {
    type: 'MinKey',
  },
};

export const MaxKey: Story = {
  args: {
    type: 'MaxKey',
  },
};
