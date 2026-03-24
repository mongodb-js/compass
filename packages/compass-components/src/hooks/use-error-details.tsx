import { showConfirmation } from './use-confirmation';
import { Code, ConfirmationModalVariant } from '../components/leafygreen';
import { css } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import React from 'react';

const errorDetailsContentClassName = css({
  paddingTop: spacing[400],
  overflow: 'auto',
  minHeight: 0,
  // Reserve ~280px for dialog padding, title, and footer so total modal height stays within the viewport.
  // (A smaller subtract like 180px let header + JSON + footer exceed 100vh, so the whole modal scrolled.)
  maxHeight: 'calc(100vh - 280px)',
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
      <div className={errorDetailsContentClassName}>
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
