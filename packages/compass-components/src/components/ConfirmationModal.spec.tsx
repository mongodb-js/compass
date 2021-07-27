import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { axe, toHaveNoViolations } from 'jest-axe';

import ConfirmationModal from './ConfirmationModal';

expect.extend(toHaveNoViolations);

function renderModal() {
  return render(
    <ConfirmationModal
      title="Pineapples"
      buttonText="Confirm"
      open
    >
      <div
        data-testid="testing-inner-content"
      >
        inner content
      </div>
    </ConfirmationModal>
  );
}

describe('ConfirmationModal Component', () => {
  describe('a11y', () => {
    it('does not have basic accessibility issues', async () => {
      const { container, getByText } = renderModal();
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      let newResults;
      act(() => {
        fireEvent.click(getByText('Confirm'))
      });
      await act(async () => {
        newResults = await axe(container);
      });
      expect(newResults).toHaveNoViolations();
    });
  });

  it('should show the modal heading', () => {
    renderModal();
    expect(screen.getByRole('heading')).toHaveTextContent('Pineapples');
  });

  it('should show the modal button', () => {
    renderModal();
    const button = screen.getByText('Confirm').closest('button');
    expect(button).not.toBeDisabled();
  });

  it('should show the modal content', () => {
    renderModal();
    const innerContent = screen.getByTestId('testing-inner-content');
    expect(innerContent).toHaveTextContent('inner content');
    expect(innerContent).toBeVisible();
  });
});
