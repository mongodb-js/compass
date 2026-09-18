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

    it('caps the modal height so the footer stays visible', function () {
      // The single max-height lives on the modal itself.
      expect(getComputedStyle(modal).maxHeight).to.equal('90vh');
    });

    it('scrolls the JSON content internally without a nested max-height', function () {
      const content = within(modal).getByTestId('error-details-content');
      const contentStyles = getComputedStyle(content);
      // Content scrolls on its own when the JSON is long...
      expect(contentStyles.overflow).to.equal('auto');
      // ...with a fixed gap between the header and the code editor...
      expect(contentStyles.paddingTop).to.equal('16px');
      // ...but does not introduce a second max-height that would nest scrollbars.
      expect(contentStyles.maxHeight).to.equal('');
    });
  });
});
