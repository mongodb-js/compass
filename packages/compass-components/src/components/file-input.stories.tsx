import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FileInput, { FileInputBackendContext } from './file-input';

// Mock backend for Storybook
const mockBackend = {
  openFileChooser: () => {
    // Mock file chooser opening
  },
  onFilesChosen: (listener: (files: string[]) => void) => {
    // Simulate file selection after a delay
    setTimeout(() => {
      listener(['/path/to/file.txt']);
    }, 1000);
    return () => {
      // Cleanup function
    };
  },
  getPathForFile: (file: File) => file.name,
};

const meta = {
  title: 'Components/Forms/FileInput',
  component: FileInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <FileInputBackendContext.Provider value={() => mockBackend}>
        <Story />
      </FileInputBackendContext.Provider>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'small', 'vertical'],
      description: 'The visual variant of the file input',
    },
    mode: {
      control: 'select',
      options: ['open', 'save'],
      description: 'Whether to open or save files',
    },
    multi: {
      control: 'boolean',
      description: 'Whether to allow multiple file selection',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the file input is disabled',
    },
    optional: {
      control: 'boolean',
      description: 'Whether the file input is optional',
    },
    error: {
      control: 'boolean',
      description: 'Whether to show error state',
    },
    showFileOnNewLine: {
      control: 'boolean',
      description: 'Whether to show selected files on a new line',
    },
    onChange: {
      action: 'changed',
      description: 'Function called when files are selected',
    },
  },
} satisfies Meta<typeof FileInput>;

export default meta;
type Story = StoryObj<typeof FileInput>;

/**
 * The FileInput component is a file selection input that supports both web and Electron environments.
 * It provides a consistent interface for file selection across different platforms.
 *
 * Features:
 * - Multiple variants (default, small, vertical)
 * - Support for single and multiple file selection
 * - Open and save modes
 * - Optional state
 * - Error state
 * - File filtering
 * - Custom button labels
 * - Dark mode support
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleChange = (_files: string[]) => {
  // Handle file selection
};

export const Default: Story = {
  args: {
    id: 'file-input',
    label: 'Select File',
    onChange: handleChange,
  },
};

export const Small: Story = {
  args: {
    id: 'file-input-small',
    label: 'Select File',
    variant: 'small',
    onChange: handleChange,
  },
};

export const Vertical: Story = {
  args: {
    id: 'file-input-vertical',
    label: 'Select File',
    variant: 'vertical',
    onChange: handleChange,
  },
};

export const Multiple: Story = {
  args: {
    id: 'file-input-multiple',
    label: 'Select Files',
    multi: true,
    onChange: handleChange,
  },
};

export const SaveMode: Story = {
  args: {
    id: 'file-input-save',
    label: 'Save File',
    mode: 'save',
    onChange: handleChange,
  },
};

export const WithDescription: Story = {
  args: {
    id: 'file-input-description',
    label: 'Select File',
    description: 'Choose a file to upload',
    onChange: handleChange,
  },
};

export const WithError: Story = {
  args: {
    id: 'file-input-error',
    label: 'Select File',
    error: true,
    errorMessage: 'Please select a file',
    onChange: handleChange,
  },
};

export const Optional: Story = {
  args: {
    id: 'file-input-optional',
    label: 'Select File',
    optional: true,
    optionalMessage: 'Optional',
    onChange: handleChange,
  },
};

export const Disabled: Story = {
  args: {
    id: 'file-input-disabled',
    label: 'Select File',
    disabled: true,
    onChange: handleChange,
  },
};
