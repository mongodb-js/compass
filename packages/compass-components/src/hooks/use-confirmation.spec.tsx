import {
  cleanup,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
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

      userEvent.click(screen.getByText('Open Modal'));
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
      userEvent.click(within(modal).getByText('Cancel'));
      await waitForElementToBeRemoved(() =>
        screen.getByTestId('confirmation-modal')
      );
    });

    it('handles confirm action', async function () {
      userEvent.click(within(modal).getByText('Yes'));
      await waitForElementToBeRemoved(() =>
        screen.getByTestId('confirmation-modal')
      );
    });
  });

  context('showConfirmation global function', function () {
    let modal: HTMLElement;
    let response: Promise<boolean>;
    beforeEach(async function () {
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
      await waitFor(() => {
        modal = screen.getByTestId('confirmation-modal');
      });
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
      userEvent.click(within(modal).getByText('Cancel'));
      const confirmed = await response;
      expect(confirmed).to.be.false;
    });

    it('handles confirm action', async function () {
      userEvent.click(within(modal).getByText('Yes'));
      const confirmed = await response;
      expect(confirmed).to.be.true;
    });
  });

  context(
    'when asking for confirmation multiple times with the same required input',
    function () {
      it('should always require to enter a confirmation input before confirming', async function () {
        render(<ConfirmationModalArea></ConfirmationModalArea>);

        // Run the confirmation flow with the same required input multiple times
        // to make sure that buttons are initially disabled
        for (let i = 0; i < 3; i++) {
          const response = showConfirmation({
            requiredInputText: 'Yes',
          });

          expect(
            screen.getByRole('button', { name: 'Confirm' })
          ).to.have.attribute('aria-disabled', 'true');

          userEvent.type(
            screen.getByRole('textbox', { name: /Type "Yes"/ }),
            'Yes'
          );

          expect(
            screen.getByRole('button', { name: 'Confirm' })
          ).to.have.attribute('aria-disabled', 'false');

          userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

          expect(await response).to.eq(true);
        }
      });
    }
  );
});
