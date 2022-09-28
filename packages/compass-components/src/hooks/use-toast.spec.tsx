import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';

import { ToastArea, ToastVariant, useToast } from './use-toast';

const OpenToastButton = ({
  namespace,
  id,
  title,
  variant,
  timeout,
  body,
}: {
  namespace: string;
  variant: ToastVariant;
  id: string;
  title: string;
  timeout?: number;
  body?: string;
}) => {
  const { openToast } = useToast(namespace);
  return (
    <button onClick={() => openToast(id, { title, variant, body, timeout })}>
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
  return <button onClick={() => closeToast(id)}>Close Toast</button>;
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
          body="Toast body"
          variant={ToastVariant.Success}
        />
        <CloseToastButton namespace="ns-1" id="toast-1" />
      </ToastArea>
    );

    fireEvent.click(screen.getByText('Open Toast'));

    await screen.findByText('My Toast');
    screen.getByText('Toast body');

    fireEvent.click(screen.getByText('Close Toast'));

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
            body="Toast body"
            timeout={1000}
            variant={ToastVariant.Success}
          />
        </ToastArea>
      );

      fireEvent.click(screen.getByText('Open Toast'));

      await screen.findByText('My Toast');

      await waitForElementToBeRemoved(() => {
        return screen.queryByText('My Toast');
      });

      expect(screen.queryByText('My Toast')).to.not.exist;
    });
  });
});
