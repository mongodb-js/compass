import { showConfirmation } from './use-confirmation';
import { Code, ConfirmationModalVariant } from '../components/leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import React from 'react';

const errorDetailsCodeStyles = css({
  marginTop: spacing[200],
  maxHeight: 'calc(100vh - 320px)',
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
        className={errorDetailsCodeStyles}
        language="json"
        data-testid="error-details-json"
        id="error-details-json"
      >
        {JSON.stringify(details, undefined, 2)}
      </Code>
    ),
    hideCancelButton: true,
    buttonText: closeAction.replace(/\b\w/g, (c) => c.toUpperCase()),
    variant: ConfirmationModalVariant.Default,
  });
};
