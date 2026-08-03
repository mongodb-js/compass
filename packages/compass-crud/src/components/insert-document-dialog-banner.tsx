import React, { useMemo } from 'react';
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
  documentWriteError: WriteError | null;
  insertInProgress: boolean;
  documentValidationError: Error | null;
  violationCount: number;
  onFixViolations: () => void;
};

export function InsertDocumentDialogBanner({
  documentWriteError,
  insertInProgress,
  documentValidationError,
  violationCount,
  onFixViolations,
}: InsertDocumentDialogBannerProps) {
  const banner = useMemo(() => {
    if (documentValidationError) {
      return {
        message: documentValidationError.message,
        variant: 'danger' as const,
      };
    }
    if (violationCount > 0) {
      return {
        message: 'Unsafe integer violation',
        variant: 'danger' as const,
        action: {
          onClick: onFixViolations,
          text:
            violationCount === 1 ? 'Convert to Long' : 'Convert all to Long',
        },
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
    violationCount,
    onFixViolations,
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
