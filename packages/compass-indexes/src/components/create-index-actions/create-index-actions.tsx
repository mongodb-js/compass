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
  clearError,
  inProgress,
  createIndex,
  closeCreateIndexModal,
}: {
  error: string | null;
  clearError: () => void;
  inProgress: boolean;
  createIndex: () => void;
  closeCreateIndexModal: () => void;
}) {
  const renderError = () => {
    if (!error) {
      return;
    }

    return (
      <div
        data-testid="create-index-actions-error-banner-wrapper"
        className={bannerStyles}
      >
        <Banner variant="danger" dismissible onClose={clearError}>
          {error}
        </Banner>
      </div>
    );
  };

  const renderInProgress = () => {
    if (error || !inProgress) {
      return;
    }

    return (
      <div
        data-testid="create-index-actions-in-progress-banner-wrapper"
        className={bannerStyles}
      >
        <Banner variant="info">
          Index creation in progress. The dialog can be closed.
        </Banner>
      </div>
    );
  };

  const onCancel = () => {
    closeCreateIndexModal();
  };

  const onConfirm = () => {
    createIndex();
  };

  return (
    <div className={containerStyles}>
      {renderError()}
      {renderInProgress()}

      <Button
        data-testid="create-index-actions-cancel-button"
        onClick={onCancel}
      >
        {inProgress ? 'Close' : 'Cancel'}
      </Button>
      {!inProgress && (
        <Button
          data-testid="create-index-actions-create-index-button"
          onClick={onConfirm}
          variant="primary"
          className={createIndexButtonStyles}
        >
          Create Index
        </Button>
      )}
    </div>
  );
}

export default CreateIndexActions;
