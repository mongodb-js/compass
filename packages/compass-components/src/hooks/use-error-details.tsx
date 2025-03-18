import {
  type showConfirmation as originalShowConfirmation,
  showConfirmation,
  useConfirmationModal,
} from './use-confirmation';
import { Code } from '../components/leafygreen';
import React from 'react';

const getShowErrorDetails = (
  showConfirmation: typeof originalShowConfirmation
) => {
  return ({
    details,
    closeAction,
  }: {
    details: Record<string, unknown>;
    closeAction: 'back' | 'close';
  }) =>
    void showConfirmation({
      title: 'Error details',
      description: (
        <Code
          language="json"
          data-testid="error-details-json"
          id="error-details-json"
        >
          {JSON.stringify(details, undefined, 2)}
        </Code>
      ),
      hideCancelButton: true,
      buttonText: closeAction.replace(/\b\w/g, (c) => c.toUpperCase()),
      // modalProps
      // buttonProps
    });
};

export function useErrorDetailsModal() {
  const { showConfirmation } = useConfirmationModal();

  return { showErrorDetails: getShowErrorDetails(showConfirmation) };
}

export const showErrorDetails = getShowErrorDetails(showConfirmation);
