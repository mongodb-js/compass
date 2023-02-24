import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';

import {
  ConfirmationModalArea,
  useConfirmationModal,
  showConfirmation,
} from './use-confirmation';

const OpenConfirmationModalButton = () => {
  const { showConfirmation } = useConfirmationModal();
  return (
    <button
      type="button"
      onClick={() =>
        void showConfirmation({
          title: 'Are you sure?',
          description: 'This action can not be undone.',
          buttonText: 'Yes',
        })
      }
    >
      Open Modal
    </button>
  );
};

// https://github.com/nodejs/node/issues/40678
// CustomEvent is a global in browsers but not in our current node version
class CustomEvent extends Event {
  public detail: any;
  constructor(type: string, options: any) {
    super(type, options);
    this.detail = options?.detail ?? null;
  }
}
// @ts-expect-error
globalThis.CustomEvent = CustomEvent;

describe('use-confirmation', function () {
  afterEach(cleanup);

  context('useConfirmationModal hook', function () {
    let modal: HTMLElement;
    beforeEach(function () {
      render(
        <ConfirmationModalArea>
          <OpenConfirmationModalButton />
        </ConfirmationModalArea>
      );

      fireEvent.click(screen.getByText('Open Modal'));
      modal = screen.getByTestId('confirmation-modal');
      expect(modal).to.exist;
    });

    it('renders modal contents', function () {
      expect(within(modal).getByText('Are you sure?')).to.exist;
      expect(
        within(modal).getByText('This action can not be undone.')
      ).to.exist;
      expect(within(modal).getByText('Yes')).to.exist;
      expect(within(modal).getByText('Cancel')).to.exist;
    });

    it('handles cancel action', async function () {
      fireEvent.click(within(modal).getByText('Cancel'));
      await waitForElementToBeRemoved(() =>
        screen.getByTestId('confirmation-modal')
      );
    });

    it('handles confirm action', async function () {
      fireEvent.click(within(modal).getByText('Yes'));
      await waitForElementToBeRemoved(() =>
        screen.getByTestId('confirmation-modal')
      );
    });
  });

  context('showConfirmation global function', function () {
    let modal: HTMLElement;
    let response: Promise<boolean>;
    beforeEach(function () {
      render(
        <ConfirmationModalArea>
          <div />
        </ConfirmationModalArea>
      );
      response = showConfirmation({
        title: 'Are you sure?',
        description: 'This action can not be undone.',
        buttonText: 'Yes',
      });
      modal = screen.getByTestId('confirmation-modal');
      expect(modal).to.exist;
    });

    it('renders modal contents', function () {
      expect(within(modal).getByText('Are you sure?')).to.exist;
      expect(
        within(modal).getByText('This action can not be undone.')
      ).to.exist;
      expect(within(modal).getByText('Yes')).to.exist;
      expect(within(modal).getByText('Cancel')).to.exist;
    });

    it('handles cancel action', async function () {
      fireEvent.click(within(modal).getByText('Cancel'));
      const confirmed = await response;
      expect(confirmed).to.be.false;
    });

    it('handles confirm action', async function () {
      fireEvent.click(within(modal).getByText('Yes'));
      const confirmed = await response;
      expect(confirmed).to.be.true;
    });
  });
});
