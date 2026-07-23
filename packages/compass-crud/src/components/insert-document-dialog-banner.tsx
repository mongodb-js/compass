import React, { useMemo } from 'react';
import { UnsafeIntegerValidationError } from 'hadron-document';
import {
  Banner,
  Button,
  css,
  spacing,
  showErrorDetails,
} from '@mongodb-js/compass-components';
import type { WriteError } from '../stores/crud-store';

const bannerStyles = css({
  marginTop: spacing[400],
});
const actionContainerStyles = css({
  marginTop: spacing[200],
});

type InsertDocumentDialogBannerProps = {
  documentWriteError: WriteError;
  insertInProgress: boolean;
  documentValidationError: Error | null;
  onFixUnsafeIntegerViolations: () => void;
};

export function InsertDocumentDialogBanner({
  documentWriteError,
  insertInProgress,
  documentValidationError,
  onFixUnsafeIntegerViolations,
}: InsertDocumentDialogBannerProps) {
  const banner = useMemo(() => {
    if (documentValidationError) {
      const hasViolations =
        documentValidationError instanceof UnsafeIntegerValidationError &&
        documentValidationError.violations.length > 0;
      const numViolations = hasViolations
        ? documentValidationError.violations.length
        : 0;
      return {
        message: documentValidationError.message,
        variant: 'danger' as const,
        ...(hasViolations && {
          action: {
            onClick: onFixUnsafeIntegerViolations,
            text: `Convert ${numViolations === 1 ? '' : 'all'} to Int64`,
          },
        }),
      };
    }
    if (insertInProgress) {
      return { message: 'Inserting Document', variant: 'info' as const };
    }
    if (documentWriteError) {
      return {
        message: documentWriteError.message,
        variant: 'danger' as const,
        ...(documentWriteError.info && {
          action: {
            onClick: function () {
              showErrorDetails({
                details: documentWriteError.info!,
                closeAction: 'back',
              });
            },
            text: 'VIEW ERROR DETAILS',
          },
        }),
      };
    }
    return null;
  }, [
    documentValidationError,
    insertInProgress,
    documentWriteError,
    onFixUnsafeIntegerViolations,
  ]);

  if (!banner) {
    return null;
  }

  return (
    <Banner
      data-testid="insert-document-banner"
      data-variant={banner.variant}
      variant={banner.variant}
      className={bannerStyles}
    >
      {banner.message}
      {'action' in banner && (
        <div className={actionContainerStyles}>
          <Button
            size="xsmall"
            onClick={banner.action!.onClick}
            data-testid="insert-document-error-action-button"
          >
            {banner.action!.text}
          </Button>
        </div>
      )}
    </Banner>
  );
}
