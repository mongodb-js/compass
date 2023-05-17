import {
  cleanup,
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import React from 'react';

import { ToastArea, useToast } from './use-toast';
import type { ToastProperties } from './use-toast';

const OpenToastButton = ({
  namespace,
  id,
  ...toastProps
}: {
  namespace: string;
  id: string;
} & ToastProperties) => {
  const { openToast } = useToast(namespace);
  return (
    <button type="button" onClick={() => openToast(id, toastProps)}>
      Open Toast
    </button>
  );
};

const CloseToastButton = ({
  namespace,
  id,
}: {
  namespace: string;
  id: string;
}) => {
  const { closeToast } = useToast(namespace);
  return (
    <button type="button" onClick={() => closeToast(id)}>
      Close Toast
    </button>
  );
};

describe('useToast', function () {
  afterEach(cleanup);

  it('opens and closes a toast', async function () {
    render(
      <ToastArea>
        <OpenToastButton
          namespace="ns-1"
          id="toast-1"
          title="My Toast"
          description="Toast body"
          variant="success"
        />
        <CloseToastButton namespace="ns-1" id="toast-1" />
      </ToastArea>
    );

    userEvent.click(screen.getByText('Open Toast'));

    expect(await screen.findByText('My Toast')).to.exist;

    userEvent.click(screen.getByText('Close Toast'));

    await waitForElementToBeRemoved(() => {
      return screen.queryByText('My Toast');
    });

    expect(screen.queryByText('My Toast')).to.not.exist;
  });

  it('is dismissible by default', async function () {
    render(
      <ToastArea>
        <OpenToastButton
          namespace="ns-1"
          id="toast-1"
          title="My Toast"
          description="Toast body"
          variant="success"
        />
        <CloseToastButton namespace="ns-1" id="toast-1" />
      </ToastArea>
    );

    userEvent.click(screen.getByText('Open Toast'));

    await screen.findByText('My Toast');

    userEvent.click(screen.getByLabelText('Close Message'));

    await waitForElementToBeRemoved(() => {
      return screen.queryByText('My Toast');
    });

    expect(screen.queryByText('My Toast')).to.not.exist;
  });

  describe('with timeout', function () {
    it('closes a toast after timeout expires', async function () {
      render(
        <ToastArea>
          <OpenToastButton
            namespace="ns-1"
            id="toast-1"
            title="My Toast"
            description="Toast body"
            timeout={300}
            variant="success"
          />
        </ToastArea>
      );

      userEvent.click(screen.getByText('Open Toast'));

      await screen.findByText('My Toast');

      await waitForElementToBeRemoved(
        () => {
          return screen.queryByText('My Toast');
        },
        { timeout: 5_000 }
      );

      expect(screen.queryByText('My Toast')).to.not.exist;
    });
  });
});
