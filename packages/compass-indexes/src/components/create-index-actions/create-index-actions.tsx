import React from 'react';
import {
  css,
  Banner,
  spacing,
  ModalFooterButton,
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
    <>
      <div>
        {renderError()}
        {renderInProgress()}
      </div>
      <div className={modalFooterActionsStyles}>
        <ModalFooterButton
          data-testid="create-index-actions-cancel-button"
          onClick={onCancel}
        >
          {inProgress ? 'Close' : 'Cancel'}
        </ModalFooterButton>
        {!inProgress && (
          <ModalFooterButton
            data-testid="create-index-actions-create-index-button"
            onClick={onConfirm}
            variant="primary"
            className={createIndexButtonStyles}
            type="submit"
          >
            Create Index
          </ModalFooterButton>
        )}
      </div>
    </>
  );
}

export default CreateIndexActions;
