import {
  render,
  screen,
  waitForElementToBeRemoved,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import React from 'react';

import { ToastArea, openToast, closeToast } from './use-toast';
import type { ToastProperties } from './use-toast';

const OpenToastButton = ({
  namespace,
  id,
  ...toastProps
}: {
  namespace: string;
  id: string;
} & ToastProperties) => {
  return (
    <button
      type="button"
      onClick={() => {
        openToast(`${namespace}--${id}`, toastProps);
      }}
    >
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
  return (
    <button
      type="button"
      onClick={() => {
        closeToast(`${namespace}:${id}`, id);
      }}
    >
      Close Toast
    </button>
  );
};

describe('openToast / closeToast', function () {
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
