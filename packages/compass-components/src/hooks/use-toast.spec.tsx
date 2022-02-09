import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';

import { ToastArea, ToastVariant, useToast } from '..';

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
    let clock;

    beforeEach(function () {
      clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      clock.restore();
    });

    it('closes a toast after timeout expires', async function () {
      render(
        <ToastArea>
          <OpenToastButton
            namespace="ns-1"
            id="toast-1"
            title="My Toast"
            body="Toast body"
            timeout={5000}
            variant={ToastVariant.Success}
          />
        </ToastArea>
      );

      fireEvent.click(screen.getByText('Open Toast'));

      await screen.findByText('My Toast');

      clock.tick(2000);

      await screen.findByText('My Toast');

      clock.tick(3001);

      expect(screen.queryByText('My Toast')).to.not.exist;
    });
  });
});
