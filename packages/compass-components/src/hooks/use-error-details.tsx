import { showConfirmation } from './use-confirmation';
import { Code, ConfirmationModalVariant } from '../components/leafygreen';
import React from 'react';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

const codeStyles = css({
  maxHeight: '40vh',
  overflow: 'auto',
});

const descriptionStyles = css({
  marginTop: `-${spacing[100]}px`,
});

export const showErrorDetails = function showErrorDetails({
  details,
  closeAction,
}: {
  details: Record<string, unknown>;
  closeAction: 'back' | 'close';
}) {
  void showConfirmation({
    title: 'Error details',
    description: (
      <div className={descriptionStyles}>
        <Code
          language="json"
          data-testid="error-details-json"
          id="error-details-json"
          className={codeStyles}
        >
          {JSON.stringify(details, undefined, 2)}
        </Code>
      </div>
    ),
    hideCancelButton: true,
    buttonText: closeAction.replace(/\b\w/g, (c) => c.toUpperCase()),
    variant: ConfirmationModalVariant.Default,
  });
};
