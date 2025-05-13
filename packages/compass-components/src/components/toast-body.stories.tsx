import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ToastBody } from './toast-body';
import { ToastArea, openToast } from '../hooks/use-toast';
import { Button } from './leafygreen';

const meta = {
  title: 'Components/Toast',
  component: ToastBody,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastBody>;

export default meta;

type Story = StoryObj<typeof ToastBody>;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const ToastExample = () => {
  return (
    <ToastArea>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          onClick={() => {
            openToast('success-toast', {
              title: 'Success',
              description: (
                <ToastBody
                  statusMessage="Operation completed successfully"
                  actionText="View Details"
                  actionHandler={noop}
                />
              ),
              variant: 'success',
              timeout: 5000,
            });
          }}
        >
          Show Success Toast
        </Button>
        <Button
          onClick={() => {
            openToast('error-toast', {
              title: 'Error',
              description: (
                <ToastBody
                  statusMessage="Failed to complete operation"
                  actionText="Try Again"
                  actionHandler={noop}
                />
              ),
              variant: 'warning',
              timeout: 5000,
            });
          }}
        >
          Show Error Toast
        </Button>
        <Button
          onClick={() => {
            openToast('progress-toast', {
              title: 'Progress',
              description: (
                <ToastBody
                  statusMessage="Operation in progress..."
                  actionText="Cancel"
                  actionHandler={noop}
                />
              ),
              variant: 'progress',
              progress: 0.5,
              timeout: null,
            });
          }}
        >
          Show Progress Toast
        </Button>
      </div>
    </ToastArea>
  );
};
ToastExample.displayName = 'ToastExample';

const DefaultStory = () => <ToastExample />;
DefaultStory.displayName = 'DefaultStory';

export const Default: Story = {
  render: DefaultStory,
  parameters: {
    docs: {
      description: {
        story:
          'Example of how to use toasts in your application. The ToastBody component is used within the toast description to provide a consistent layout for the message and action button.',
      },
      source: {
        code: `
import { ToastArea, openToast } from '@mongodb-js/compass-components';
import { ToastBody } from '@mongodb-js/compass-components';

// Wrap your app with ToastArea
<ToastArea>
  <Button
    onClick={() => {
      openToast('success-toast', {
        title: 'Success',
        description: (
          <ToastBody
            statusMessage="Operation completed successfully"
            actionText="View Details"
            actionHandler={() => {}}
          />
        ),
        variant: 'success',
        timeout: 5000,
      });
    }}
  >
    Show Success Toast
  </Button>
</ToastArea>`,
      },
    },
  },
};

const WithActionExample = () => {
  return (
    <ToastArea>
      <Button
        onClick={() => {
          openToast('with-action-toast', {
            title: 'With Action',
            description: (
              <ToastBody
                statusMessage="Operation completed successfully"
                actionText="View Details"
                actionHandler={noop}
              />
            ),
            variant: 'success',
            timeout: 5000,
          });
        }}
      >
        Show Toast with Action
      </Button>
    </ToastArea>
  );
};
WithActionExample.displayName = 'WithActionExample';

const LongMessageExample = () => {
  return (
    <ToastArea>
      <Button
        onClick={() => {
          openToast('long-message-toast', {
            title: 'Long Message',
            description: (
              <ToastBody
                statusMessage="This is a very long message that might wrap to multiple lines in the toast notification. It demonstrates how the component handles longer content."
                actionText="View Details"
                actionHandler={noop}
              />
            ),
            variant: 'success',
            timeout: 5000,
          });
        }}
      >
        Show Toast with Long Message
      </Button>
    </ToastArea>
  );
};
LongMessageExample.displayName = 'LongMessageExample';

const WithoutActionExample = () => {
  return (
    <ToastArea>
      <Button
        onClick={() => {
          openToast('without-action-toast', {
            title: 'Without Action',
            description: (
              <ToastBody statusMessage="Operation completed successfully" />
            ),
            variant: 'success',
            timeout: 5000,
          });
        }}
      >
        Show Toast without Action
      </Button>
    </ToastArea>
  );
};
WithoutActionExample.displayName = 'WithoutActionExample';

export const WithAction: Story = {
  render: WithActionExample,
  parameters: {
    docs: {
      description: {
        story:
          'Example of a toast with an action button. The action button can be used to perform additional actions related to the toast message.',
      },
    },
  },
};

export const LongMessage: Story = {
  render: LongMessageExample,
  parameters: {
    docs: {
      description: {
        story:
          'Example of a toast with a long message. The ToastBody component handles long content gracefully with proper wrapping.',
      },
    },
  },
};

export const WithoutAction: Story = {
  render: WithoutActionExample,
  parameters: {
    docs: {
      description: {
        story:
          'Example of a toast without an action button. The ToastBody component works well with just a message.',
      },
    },
  },
};

/**
 * The ToastBody component is used to display the content of a toast notification.
 * It supports both a status message and an optional action button.
 *
 * Features:
 * - Flexible layout with message and action button
 * - Optional action button with custom text
 * - Consistent styling with LeafyGreen design system
 * - Test ID support for action buttons
 */
