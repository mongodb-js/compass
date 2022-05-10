import React from 'react';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';

import { ErrorSummary, WarningSummary } from './error-warning-summary';

function renderSummary(
  Component: typeof ErrorSummary | typeof WarningSummary,
  errorOrWarnings: string[]
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
      renderSummary(Summary, ['this is an error.']);

      expect(screen.getByText('this is an error.')).to.be.visible;
    });

    it('renders 2 errors', function () {
      renderSummary(Summary, ['first error', 'second error']);

      expect(screen.getByText('first error')).to.be.visible;
      expect(screen.getByText('second error')).to.be.visible;
    });

    it('renders 3 errors as tooltip', function () {
      renderSummary(Summary, ['first error', 'second error', 'third error']);

      expect(screen.getByText(/first error, and other 2 +problems\./)).to.be
        .visible;
      expect(screen.getByText('View all')).to.be.visible;
    });

    it('strips "." at the end of first error', function () {
      renderSummary(Summary, ['first error.', 'second error', 'third error']);

      expect(screen.getByText(/first error, +and/)).to.be.visible;
    });
  });
});
