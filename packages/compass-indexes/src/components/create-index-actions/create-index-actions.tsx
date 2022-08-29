import React from 'react';
import {
  css,
  withTheme,
  Banner,
  spacing,
  Button,
} from '@mongodb-js/compass-components';

const bannerStyles = css({
  margin: `${spacing[3]}px 0`,
});

const createIndexButtonStyles = css({
  marginLeft: spacing[2],
});

const modalFooterActionsStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[2],
});

/**
 * Create index actions.
 */
function CreateIndexActions({
  darkMode,
  error,
  clearError,
  inProgress,
  createIndex,
  closeCreateIndexModal,
}: {
  darkMode?: boolean;
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
      <div data-testid="create-index-actions-error-banner-wrapper">
        <Banner
          className={bannerStyles}
          variant="danger"
          dismissible
          onClose={clearError}
        >
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
      <div data-testid="create-index-actions-in-progress-banner-wrapper">
        <Banner className={bannerStyles} variant="info">
          Create in Progress
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
    <>
      <div>
        {renderError()}
        {renderInProgress()}
      </div>
      <div className={modalFooterActionsStyles}>
        <Button
          data-testid="create-index-actions-create-index-button"
          onClick={onConfirm}
          variant="primary"
          className={createIndexButtonStyles}
          darkMode={darkMode}
        >
          Create Index
        </Button>
        <Button
          data-testid="create-index-actions-cancel-button"
          darkMode={darkMode}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </>
  );
}

export default withTheme(CreateIndexActions);
