import { showConfirmation } from './use-confirmation';
import { Code, ConfirmationModalVariant } from '../components/leafygreen';
import React from 'react';
import { css } from '@leafygreen-ui/emotion';

const codeStyles = css({
  maxHeight: '40vh',
  overflow: 'auto',
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
      <Code
        language="json"
        data-testid="error-details-json"
        id="error-details-json"
        className={codeStyles}
      >
        {JSON.stringify(details, undefined, 2)}
      </Code>
    ),
    hideCancelButton: true,
    buttonText: closeAction.replace(/\b\w/g, (c) => c.toUpperCase()),
    variant: ConfirmationModalVariant.Default,
  });
};
