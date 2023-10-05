import React from 'react';
import { connect } from 'react-redux';

import {
  css,
  Label,
  spacing,
  Banner,
  ConfirmationModal,
  Icon,
  Body,
  TextInput,
} from '@mongodb-js/compass-components';

import { toggleIsVisible } from '../../modules/is-visible';
import { nameChanged } from '../../modules/drop-index/name';
import { changeConfirmName } from '../../modules/drop-index/confirm-name';
import { clearError } from '../../modules/drop-index/error';
import { dropIndex } from '../../modules/drop-index';
import { resetForm } from '../../modules/reset-form';

import type { RootState } from '../../modules/drop-index';
import { useTrackOnChange } from '@mongodb-js/compass-logging/provider';

const messageStyles = css({
  display: 'flex',
  gap: spacing[1],
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const bannerStyles = css({
  margin: `${spacing[3]}px 0`,
});

const iconStyles = css({ flexShrink: 0 });

const messageTextStyles = css({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 3,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

export type DropIndexFormProps = {
  isVisible: boolean;
  inProgress: boolean;
  error?: string | null;
  name: string;
  confirmName: string;
  toggleIsVisible: (isVisible: boolean) => void;
  toggleInProgress: () => void;
  changeConfirmName: (name: string) => void;
  resetForm: () => void;
  dropIndex: (name: string) => void;
  clearError: () => void;
};

/**
 * Drop index modal.
 */
export function DropIndexModal({
  isVisible,
  inProgress,
  error,
  name,
  confirmName,
  toggleIsVisible,
  changeConfirmName,
  resetForm,
  dropIndex,
  clearError,
}: DropIndexFormProps) {
  const onFormSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
  };

  const handleClose = () => {
    toggleIsVisible(false);
    resetForm();
  };

  const handleConfirm = () => {
    dropIndex(name);
  };

  const renderError = () => {
    if (!error) {
      return;
    }

    return (
      <div data-testid="drop-index-error-banner-wrapper">
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
      <div data-testid="drop-index-in-progress-banner-wrapper">
        <Banner className={bannerStyles} variant="info">
          Index dropping in progress.
        </Banner>
      </div>
    );
  };

  useTrackOnChange(
    'COMPASS-INDEXES-UI',
    (track) => {
      if (isVisible) {
        track('Screen', { name: 'drop_index_modal' });
      }
    },
    [isVisible],
    undefined
  );

  return (
    <ConfirmationModal
      title="Drop Index"
      open={isVisible}
      onConfirm={handleConfirm}
      onCancel={handleClose}
      buttonText="Drop"
      variant="danger"
      submitDisabled={confirmName !== name}
      data-testid="drop-index-modal"
    >
      <div className={messageStyles}>
        <Icon glyph="Warning" className={iconStyles} />
        <Body className={messageTextStyles}>
          Type the index name{' '}
          <Label htmlFor="confirm-drop-index-name">{name}</Label> to drop
        </Body>
      </div>
      <form onSubmit={onFormSubmit}>
        <TextInput
          id="confirm-drop-index-name"
          aria-labelledby="Confirm drop index"
          type="text"
          data-testid="confirm-drop-index-name"
          value={confirmName}
          onChange={(evt) => changeConfirmName(evt.target.value)}
        />
        {renderError()}
        {renderInProgress()}
      </form>
    </ConfirmationModal>
  );
}

const mapState = ({
  isVisible,
  inProgress,
  error,
  name,
  confirmName,
}: RootState) => ({
  isVisible,
  inProgress,
  error,
  name,
  confirmName,
});

const mapDispatch = {
  toggleIsVisible,
  clearError,
  nameChanged,
  changeConfirmName,
  dropIndex,
  resetForm,
};

export default connect(mapState, mapDispatch)(DropIndexModal);
