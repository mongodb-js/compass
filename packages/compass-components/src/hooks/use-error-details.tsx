import { showConfirmation } from './use-confirmation';
import { Code, ConfirmationModalVariant } from '../components/leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import React from 'react';

const errorDetailsContentStyles = css({
  paddingTop: spacing[400], // small gap above JSON
  maxHeight: '60vh', // cap JSON area height so footer can stay visible
  overflow: 'auto', // scroll JSON when long
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
      <div className={errorDetailsContentStyles}>
        <Code
          language="json"
          data-testid="error-details-json"
          id="error-details-json"
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
