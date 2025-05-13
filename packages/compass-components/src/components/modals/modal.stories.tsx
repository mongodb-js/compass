import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './modal';
import { Button } from '../leafygreen';

const meta = {
  title: 'Components/Modals/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    setOpen: {
      action: 'opened',
      description: 'Function called when the modal open state changes',
    },
    fullScreen: {
      control: 'boolean',
      description: 'Whether the modal should take up the full screen',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name for the modal container',
    },
    contentClassName: {
      control: 'text',
      description: 'Additional CSS class name for the modal content',
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof Modal>;

/**
 * The Modal component is a dialog that appears on top of the main content.
 * It's designed to focus the user's attention on a specific task or information.
 *
 * Features:
 * - Standard and full-screen modes
 * - Custom styling support
 * - Scrollable content
 * - Dark mode support
 * - Stacked component support
 */

const ModalContent = () => (
  <div style={{ padding: '20px' }}>
    <h2>Modal Title</h2>
    <p>This is the modal content. It can contain any React elements.</p>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </p>
    <div style={{ marginTop: '20px', textAlign: 'right' }}>
      <Button>Close</Button>
    </div>
  </div>
);

export const Default: Story = {
  args: {
    open: true,
    children: <ModalContent />,
  },
};

export const WithTitle: Story = {
  args: {
    open: true,
    title: 'Modal Title',
    children: <ModalContent />,
  },
};

export const FullScreen: Story = {
  args: {
    open: true,
    fullScreen: true,
    children: <ModalContent />,
  },
};

export const WithCustomClassName: Story = {
  args: {
    open: true,
    className: 'custom-modal',
    contentClassName: 'custom-modal-content',
    children: <ModalContent />,
  },
};

export const WithLongContent: Story = {
  args: {
    open: true,
    children: (
      <div style={{ padding: '20px' }}>
        <h2>Modal with Long Content</h2>
        {Array.from({ length: 10 }).map((_, i) => (
          <p key={i}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <Button>Close</Button>
        </div>
      </div>
    ),
  },
};
