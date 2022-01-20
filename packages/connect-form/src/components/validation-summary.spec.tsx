import React from 'react';
import {
  render,
  screen,
  cleanup,
  waitFor,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { expect } from 'chai';

import { ErrorSummary, WarningSummary } from './validation-summary';

function renderSummary(
  Component: typeof ErrorSummary | typeof WarningSummary,
  errorOrWarnings: { message: string }[]
) {
  if (Component === ErrorSummary) {
    return render(<ErrorSummary errors={errorOrWarnings}></ErrorSummary>);
  }

  return render(<WarningSummary warnings={errorOrWarnings}></WarningSummary>);
}

describe('ErrorSummary/WarningSummary Component', function () {
  afterEach(function () {
    cleanup();
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  [ErrorSummary, WarningSummary].forEach((Summary) => {
    it('renders a single error', function () {
      renderSummary(Summary, [{ message: 'this is an error.' }]);

      expect(screen.getByText('this is an error.')).to.be.visible;
    });

    it('renders 2 errors', function () {
      renderSummary(Summary, [
        { message: 'first error' },
        { message: 'second error' },
      ]);

      expect(screen.getByText('first error')).to.be.visible;
      expect(screen.getByText('second error')).to.be.visible;
    });

    it('renders 3 errors as tooltip', async function () {
      renderSummary(Summary, [
        { message: 'first error' },
        { message: 'second error' },
        { message: 'third error' },
      ]);

      expect(screen.getByText(/3 +problems\./)).to.be.visible;

      const trigger = screen.getByText('View All');
      expect(trigger).to.be.visible;
      userEvent.hover(trigger);

      await waitFor(() => screen.getByText('first error'));
      expect(screen.getByText('second error')).to.be.visible;
      expect(screen.getByText('third error')).to.be.visible;
    });
  });
});
