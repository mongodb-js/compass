import { showConfirmation } from './use-confirmation';
import { Code, ConfirmationModalVariant } from '../components/leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import React from 'react';

// Cap the modal height so it always fits in the viewport and the footer (Back
// button) stays visible. This is the only max-height in the modal; the code
// area below scrolls internally rather than adding a nested scrollbar.
const errorDetailsModalStyles: React.CSSProperties = {
  maxHeight: '90vh',
};

const errorDetailsContentStyles = css({
  paddingTop: spacing[400], // fixed gap between the header and the code editor
  overflow: 'auto', // scroll the JSON internally when it's long
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
    style: errorDetailsModalStyles,
    description: (
      <div
        className={errorDetailsContentStyles}
        data-testid="error-details-content"
      >
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
