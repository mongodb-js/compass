import React from 'react';
import { css, Banner, spacing, Button } from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: spacing[2],
});

const bannerStyles = css({
  flexGrow: 1,
  width: '100%',
});

const createIndexButtonStyles = css({
  flex: 'none',
});

/**
 * Create index actions.
 */
function CreateIndexActions({
  error,
  onErrorBannerCloseClick,
  onCreateIndexClick,
  onCancelCreateIndexClick,
}: {
  error: string | null;
  onErrorBannerCloseClick: () => void;
  onCreateIndexClick: () => void;
  onCancelCreateIndexClick: () => void;
}) {
  return (
    <div className={containerStyles}>
      {error && (
        <div
          data-testid="create-index-actions-error-banner-wrapper"
          className={bannerStyles}
        >
          <Banner
            variant="danger"
            dismissible
            onClose={onErrorBannerCloseClick}
          >
            {error}
          </Banner>
        </div>
      )}

      <Button
        data-testid="create-index-actions-cancel-button"
        onClick={onCancelCreateIndexClick}
      >
        Cancel
      </Button>
      <Button
        data-testid="create-index-actions-create-index-button"
        onClick={onCreateIndexClick}
        variant="primary"
        className={createIndexButtonStyles}
      >
        Create Index
      </Button>
    </div>
  );
}

export default CreateIndexActions;
