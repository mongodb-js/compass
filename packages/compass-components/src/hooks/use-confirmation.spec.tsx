import {
  render,
  screen,
  waitFor,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import React from 'react';

import { ConfirmationModalArea, showConfirmation } from './use-confirmation';

describe('use-confirmation', function () {
  context('showConfirmation global function', function () {
    let modal: HTMLElement;
    let response: Promise<boolean>;
    beforeEach(async function () {
      render(
        <ConfirmationModalArea>
          <button
            type="button"
            onClick={() => {
              response = showConfirmation({
                title: 'Are you sure?',
                description: 'This action can not be undone.',
                buttonText: 'Yes',
              });
            }}
          >
            Open Modal
          </button>
        </ConfirmationModalArea>
      );
      userEvent.click(screen.getByText('Open Modal'));
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
      const cancelElement = within(modal).getByText('Cancel');
      expect(cancelElement).to.exist;
      expect(cancelElement.parentElement).to.equal(document.activeElement);
    });

    it('handles cancel action', async function () {
      userEvent.click(within(modal).getByText('Cancel'));
      await waitFor(() => expect(modal).to.not.be.displayed);
      const confirmed = await response;
      expect(confirmed).to.be.false;
    });

    it('handles confirm action', async function () {
      userEvent.click(within(modal).getByText('Yes'));
      await waitFor(() => expect(modal).to.not.be.displayed);
      const confirmed = await response;
      expect(confirmed).to.be.true;
    });
  });

  context('when the confirmation area is not rendered yet', function () {
    it('errors when attempting to show a confirmation', async function () {
      const response = showConfirmation({ title: 'Are you sure?' });
      const responseError = response.catch((err: Error) => err);

      expect(await responseError).to.be.an('error');
      expect(await responseError).to.have.property(
        'message',
        'Confirmation modal is not registered to show confirmation'
      );
    });

    it('resolves the flushed confirmation as false when the area unmounts', async function () {
      const { unmount } = render(
        <ConfirmationModalArea></ConfirmationModalArea>
      );
      const response = showConfirmation({ title: 'Are you sure?' });

      await screen.findByTestId('confirmation-modal');
      unmount();

      expect(await response).to.eq(false);
    });
  });

  context('when the area is unmounted and mounted again', function () {
    it('shows confirmations requested against the new area', async function () {
      const { unmount } = render(
        <ConfirmationModalArea></ConfirmationModalArea>
      );
      unmount();

      render(<ConfirmationModalArea></ConfirmationModalArea>);
      const response = showConfirmation({ title: 'Are you sure?' });

      expect(await screen.findByText('Are you sure?')).to.exist;
      userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(await response).to.eq(true);
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
            await screen.findByRole('button', { name: 'Confirm' })
          ).to.have.attribute('aria-disabled', 'true');

          const textInputElement = screen.getByRole('textbox', {
            name: /Type "Yes"/,
          });

          // The input should have focus
          expect(textInputElement).to.equal(document.activeElement);
          userEvent.type(textInputElement, 'Yes');

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
