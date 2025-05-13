import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './modal';
import { ModalHeader } from './modal-header';
import { ModalBody } from './modal-body';
import { ModalFooter } from '../leafygreen';
import { ModalFooterButton } from './modal-footer-button';
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

const BasicModalExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Basic Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <ModalHeader title="Basic Modal" />
        <ModalBody>
          <p>This is a basic modal with header, body, and footer.</p>
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton onClick={() => setOpen(false)}>
            Close
          </ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
};
BasicModalExample.displayName = 'BasicModalExample';

const FormModalExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Form Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <ModalHeader
            title="Form Modal"
            subtitle="This modal contains a form with submit and cancel actions"
          />
          <ModalBody>
            <p>
              This is a form modal example showing how to handle form
              submission.
            </p>
            <div style={{ marginTop: '20px' }}>
              <label>
                Name:
                <input type="text" style={{ marginLeft: '8px' }} />
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalFooterButton
              data-testid="submit-button"
              type="submit"
              variant="primary"
            >
              Submit
            </ModalFooterButton>
            <ModalFooterButton
              data-testid="cancel-button"
              onClick={() => setOpen(false)}
              variant="default"
            >
              Cancel
            </ModalFooterButton>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
};
FormModalExample.displayName = 'FormModalExample';

const DangerModalExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Danger Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <ModalHeader
          title="Delete Confirmation"
          subtitle="This action cannot be undone"
          variant="danger"
        />
        <ModalBody variant="danger">
          <p>
            Are you sure you want to delete this item? This action cannot be
            undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton
            data-testid="delete-button"
            onClick={() => setOpen(false)}
            variant="danger"
          >
            Delete
          </ModalFooterButton>
          <ModalFooterButton
            data-testid="cancel-button"
            onClick={() => setOpen(false)}
            variant="default"
          >
            Cancel
          </ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
};
DangerModalExample.displayName = 'DangerModalExample';

const LongContentModalExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Long Content Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <ModalHeader
          title="Long Content Modal"
          subtitle="This modal demonstrates scrolling behavior"
        />
        <ModalBody>
          <h3>Section 1</h3>
          <p>This is the first section of content.</p>
          {Array.from({ length: 5 }).map((_, i) => (
            <p key={i}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
          <h3>Section 2</h3>
          <p>This is the second section of content.</p>
          {Array.from({ length: 5 }).map((_, i) => (
            <p key={i}>
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </p>
          ))}
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton onClick={() => setOpen(false)}>
            Close
          </ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
};
LongContentModalExample.displayName = 'LongContentModalExample';

const FullScreenModalExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Full Screen Modal</Button>
      <Modal open={open} setOpen={setOpen} fullScreen>
        <ModalHeader
          title="Full Screen Modal"
          subtitle="This modal takes up the entire screen"
        />
        <ModalBody>
          <p>This is a full screen modal example.</p>
          <p>
            It's useful for complex forms or when you need maximum space for
            content.
          </p>
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton onClick={() => setOpen(false)}>
            Close
          </ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
};
FullScreenModalExample.displayName = 'FullScreenModalExample';

const InfoModalExample = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Info Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <ModalHeader
          title="Information"
          subtitle="Important details about this feature"
        />
        <ModalBody>
          <p>
            This is an informational modal that provides important details to
            the user.
          </p>
          <p>
            It can contain multiple paragraphs of text and other content to help
            users understand features or requirements.
          </p>
          <ul style={{ marginTop: '12px' }}>
            <li>Feature highlights</li>
            <li>Important requirements</li>
            <li>Usage guidelines</li>
          </ul>
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton onClick={() => setOpen(false)}>
            Got it
          </ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
};
InfoModalExample.displayName = 'InfoModalExample';

export const Basic: Story = {
  render: BasicModalExample,
  parameters: {
    docs: {
      description: {
        story: 'Basic modal with header, body, and footer components.',
      },
      source: {
        code: `
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalFooterButton } from '@mongodb-js/compass-components';

function BasicModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Basic Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <ModalHeader title="Basic Modal" />
        <ModalBody>
          <p>This is a basic modal with header, body, and footer.</p>
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton onClick={() => setOpen(false)}>Close</ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
}`,
      },
    },
  },
};

export const Form: Story = {
  render: FormModalExample,
  parameters: {
    docs: {
      description: {
        story: 'Modal containing a form with submit and cancel actions.',
      },
      source: {
        code: `
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalFooterButton } from '@mongodb-js/compass-components';

function FormModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Form Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <ModalHeader
            title="Form Modal"
            subtitle="This modal contains a form with submit and cancel actions"
          />
          <ModalBody>
            <p>This is a form modal example showing how to handle form submission.</p>
            <div style={{ marginTop: '20px' }}>
              <label>
                Name:
                <input type="text" style={{ marginLeft: '8px' }} />
              </label>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalFooterButton
              type="submit"
              variant="primary"
            >
              Submit
            </ModalFooterButton>
            <ModalFooterButton
              onClick={() => setOpen(false)}
              variant="default"
            >
              Cancel
            </ModalFooterButton>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}`,
      },
    },
  },
};

export const Danger: Story = {
  render: DangerModalExample,
  parameters: {
    docs: {
      description: {
        story: 'Modal with danger variant for destructive actions.',
      },
      source: {
        code: `
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalFooterButton } from '@mongodb-js/compass-components';

function DangerModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Danger Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <ModalHeader
          title="Delete Confirmation"
          subtitle="This action cannot be undone"
          variant="danger"
        />
        <ModalBody variant="danger">
          <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton
            onClick={() => setOpen(false)}
            variant="danger"
          >
            Delete
          </ModalFooterButton>
          <ModalFooterButton
            onClick={() => setOpen(false)}
            variant="default"
          >
            Cancel
          </ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
}`,
      },
    },
  },
};

export const LongContent: Story = {
  render: LongContentModalExample,
  parameters: {
    docs: {
      description: {
        story: 'Modal with scrollable long content.',
      },
      source: {
        code: `
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalFooterButton } from '@mongodb-js/compass-components';

function LongContentModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Long Content Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <ModalHeader
          title="Long Content Modal"
          subtitle="This modal demonstrates scrolling behavior"
        />
        <ModalBody>
          <h3>Section 1</h3>
          <p>This is the first section of content.</p>
          {/* Add your long content here */}
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton onClick={() => setOpen(false)}>Close</ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
}`,
      },
    },
  },
};

export const FullScreen: Story = {
  render: FullScreenModalExample,
  parameters: {
    docs: {
      description: {
        story: 'Full screen modal for complex forms or maximum content space.',
      },
      source: {
        code: `
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalFooterButton } from '@mongodb-js/compass-components';

function FullScreenModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Full Screen Modal</Button>
      <Modal open={open} setOpen={setOpen} fullScreen>
        <ModalHeader
          title="Full Screen Modal"
          subtitle="This modal takes up the entire screen"
        />
        <ModalBody>
          <p>This is a full screen modal example.</p>
          <p>It's useful for complex forms or when you need maximum space for content.</p>
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton onClick={() => setOpen(false)}>Close</ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
}`,
      },
    },
  },
};

export const Info: Story = {
  render: InfoModalExample,
  parameters: {
    docs: {
      description: {
        story: 'Modal used for displaying informational content to users.',
      },
      source: {
        code: `
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalFooterButton } from '@mongodb-js/compass-components';

function InfoModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Info Modal</Button>
      <Modal open={open} setOpen={setOpen}>
        <ModalHeader
          title="Information"
          subtitle="Important details about this feature"
        />
        <ModalBody>
          <p>This is an informational modal that provides important details to the user.</p>
          <p>It can contain multiple paragraphs of text and other content to help users understand features or requirements.</p>
          <ul style={{ marginTop: '12px' }}>
            <li>Feature highlights</li>
            <li>Important requirements</li>
            <li>Usage guidelines</li>
          </ul>
        </ModalBody>
        <ModalFooter>
          <ModalFooterButton onClick={() => setOpen(false)}>Got it</ModalFooterButton>
        </ModalFooter>
      </Modal>
    </>
  );
}`,
      },
    },
  },
};
