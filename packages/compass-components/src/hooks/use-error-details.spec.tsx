import {
  render,
  screen,
  waitFor,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import React from 'react';

import { ConfirmationModalArea } from './use-confirmation';
import { showErrorDetails } from './use-error-details';

describe('use-error-details', function () {
  context('showErrorDetails global function', function () {
    let modal: HTMLElement;
    beforeEach(async function () {
      render(
        <ConfirmationModalArea>
          <button
            type="button"
            onClick={() => {
              showErrorDetails({
                details: { oh: 'noes' },
                closeAction: 'back',
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

    it('renders modal with cancel button focused', function () {
      expect(within(modal).getByText('Error details')).to.exist;
      const confirmElement = within(modal).getByText('Back');
      expect(confirmElement).to.exist;
      expect(confirmElement.parentElement).to.equal(document.activeElement);
    });
  });
});
