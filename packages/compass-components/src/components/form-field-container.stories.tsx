import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FormFieldContainer from './form-field-container';
import { TextInput } from './leafygreen';

const meta = {
  title: 'Components/Forms/FormFieldContainer',
  component: FormFieldContainer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
    'data-testid': {
      control: 'text',
      description: 'Test ID for testing purposes',
    },
  },
} satisfies Meta<typeof FormFieldContainer>;

export default meta;
type Story = StoryObj<typeof FormFieldContainer>;

/**
 * The FormFieldContainer component is a wrapper component that provides consistent spacing
 * for form fields. It's designed to be used with LeafyGreen form components.
 *
 * Features:
 * - Consistent vertical spacing between form fields
 * - Support for custom class names
 * - Test ID support
 */

const WithTextInputStory = (
  args: React.ComponentProps<typeof FormFieldContainer>
) => (
  <FormFieldContainer {...args}>
    <TextInput label="Username" />
  </FormFieldContainer>
);
WithTextInputStory.displayName = 'WithTextInputStory';

export const WithTextInput: Story = {
  args: {
    'data-testid': 'form-field-container',
  },
  render: WithTextInputStory,
};

const WithMultipleFieldsStory = (
  args: React.ComponentProps<typeof FormFieldContainer>
) => (
  <>
    <FormFieldContainer {...args}>
      <TextInput label="Username" />
    </FormFieldContainer>
    <FormFieldContainer {...args}>
      <TextInput label="Email" type="email" />
    </FormFieldContainer>
    <FormFieldContainer {...args}>
      <TextInput label="Password" type="password" />
    </FormFieldContainer>
  </>
);
WithMultipleFieldsStory.displayName = 'WithMultipleFieldsStory';

export const WithMultipleFields: Story = {
  args: {
    'data-testid': 'form-field-container-multiple',
  },
  render: WithMultipleFieldsStory,
};

const WithCustomClassNameStory = (
  args: React.ComponentProps<typeof FormFieldContainer>
) => (
  <FormFieldContainer {...args}>
    <TextInput label="Custom Field" />
  </FormFieldContainer>
);
WithCustomClassNameStory.displayName = 'WithCustomClassNameStory';

export const WithCustomClassName: Story = {
  args: {
    'data-testid': 'form-field-container-custom',
    className: 'custom-form-field',
  },
  render: WithCustomClassNameStory,
};
