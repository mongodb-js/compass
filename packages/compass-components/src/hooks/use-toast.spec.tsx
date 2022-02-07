import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect } from 'chai';
import React, { useCallback } from 'react';

import { ToastArea, ToastVariant } from '..';
import { useToast } from '../../lib';

const OpenToastButton = ({
  namespace,
  id,
  title,
  variant,
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
    <button
      onClick={useCallback(() => {
        openToast(id, { title, variant, body });
      }, [openToast])}
    >
      Open Toast
    </button>
  );
};

describe.only('useToast', function () {
  afterEach(cleanup);

  it('opens a toast', async function () {
    render(
      <ToastArea>
        <OpenToastButton
          namespace="ns-1"
          id="toast-1"
          title="My Toast"
          body="Toast body"
          variant={ToastVariant.Success}
        />
      </ToastArea>
    );

    fireEvent.click(screen.getByText('Open Toast'));

    await waitFor(() => {
      expect(screen.getByText('My Toast')).to.exist;
    });
  });
});
