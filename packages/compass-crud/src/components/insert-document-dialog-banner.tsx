import React, { useMemo } from 'react';
import {
  Banner,
  Button,
  css,
  spacing,
  showErrorDetails,
} from '@mongodb-js/compass-components';
import type { WriteError } from '../stores/crud-store';
import { getSafeIntegerViolationMessage } from '../utils';

const bannerStyles = css({
  marginTop: spacing[400],
});
const actionContainerStyles = css({
  marginTop: spacing[200],
});
const messageStyles = css({
  // We want to show some lines of the error, and part of the next
  // line so folks know it can scroll.
  maxHeight: '5.6em',
  overflowY: 'auto',
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
});

type InsertDocumentDialogBannerProps = {
  documentWriteError: WriteError | null;
  insertInProgress: boolean;
  documentValidationError: Error | null;
  safeIntegerViolationCount: number;
  onFixSafeIntegerViolations: () => void;
};

export function InsertDocumentDialogBanner({
  documentWriteError,
  insertInProgress,
  documentValidationError,
  safeIntegerViolationCount,
  onFixSafeIntegerViolations,
}: InsertDocumentDialogBannerProps) {
  const banner = useMemo(() => {
    if (documentValidationError) {
      return {
        message: documentValidationError.message,
        variant: 'danger' as const,
      };
    }
    if (safeIntegerViolationCount > 0) {
      return {
        message: getSafeIntegerViolationMessage(safeIntegerViolationCount),
        variant: 'danger' as const,
        action: {
          onClick: onFixSafeIntegerViolations,
          text:
            safeIntegerViolationCount === 1
              ? 'Convert to Long'
              : 'Convert all to Long',
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
    safeIntegerViolationCount,
    onFixSafeIntegerViolations,
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
      <div className={messageStyles}>{banner.message}</div>
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
