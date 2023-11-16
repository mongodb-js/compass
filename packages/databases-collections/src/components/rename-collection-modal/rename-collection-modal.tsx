import {
  Banner,
  Body,
  FormFieldContainer,
  FormModal,
  SpinLoader,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import type { RenameCollectionRootState } from '../../modules/rename-collection/rename-collection';
import { renameCollection } from '../../modules/rename-collection/rename-collection';
import { toggleIsVisible } from '../../modules/is-visible';
import { useTrackOnChange } from '@mongodb-js/compass-logging/provider';

export interface RenameCollectionModalProps {
  isVisible: boolean;
  error: Error | null;
  initialCollectionName: string;
  isRunning: boolean;
  toggleIsVisible: (isVisible: boolean) => void;
  renameCollection: (newCollectionName: string) => void;
}

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

type ModalState = 'input-form' | 'confirmation-screen';

function RenameCollectionModal({
  isVisible,
  error,
  initialCollectionName,
  isRunning,
  toggleIsVisible,
  renameCollection,
}: RenameCollectionModalProps) {
  const [newName, setNewName] = useState(initialCollectionName);
  const [modalState, setModalState] = useState<ModalState>();
  useEffect(() => {
    if (isVisible) {
      setNewName(initialCollectionName);
      setModalState('input-form');
    }
  }, [isVisible, initialCollectionName]);
  const onNameConfirmationChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setNewName(evt?.target.value);
    },
    [setNewName]
  );
  const onFormSubmit = () => {
    if (modalState === 'confirmation-screen') {
      setModalState('input-form');
      renameCollection(newName);
    } else {
      setModalState('confirmation-screen');
    }
  };

  useTrackOnChange(
    'COMPASS-DATABASES-COLLECTIONS-UI',
    (track) => {
      if (isVisible) {
        track('Screen', { name: 'rename_collection_modal' });
      }
    },
    [isVisible],
    undefined,
  );

  const onHide = useCallback(() => {
    toggleIsVisible(false);
  }, [toggleIsVisible]);

  return (
    <FormModal
      title={
        modalState === 'confirmation-screen'
          ? 'Confirm rename collection'
          : 'Rename collection'
      }
      open={isVisible}
      onSubmit={onFormSubmit}
      onCancel={onHide}
      submitButtonText={
        modalState === 'input-form'
          ? 'Proceed to Rename'
          : 'Yes, rename collection'
      }
      variant="primary"
      submitDisabled={
        modalState === 'input-form' && initialCollectionName === newName
      }
      data-testid="rename-collection-modal"
    >
      {modalState === 'input-form' && (
        <FormFieldContainer>
          <TextInput
            data-testid="rename-collection-name-input"
            label="New collection name"
            value={newName}
            onChange={onNameConfirmationChange}
          />
        </FormFieldContainer>
      )}
      {modalState === 'confirmation-screen' && (
        <div data-testid="rename-collection-confirmation-screen">
          {`Are you sure you want to rename "${initialCollectionName}" to "${newName}"?`}{' '}
        </div>
      )}
      {error && (
        <Banner variant="danger" data-testid="rename-collection-modal-error">
          {error.message}
        </Banner>
      )}
      {isRunning && (
        <Body className={progressContainerStyles}>
          <SpinLoader />
          <span>Renaming Collection&hellip;</span>
        </Body>
      )}
    </FormModal>
  );
}

const MappedRenameCollectionModal = connect(
  (
    state: RenameCollectionRootState
  ): Omit<RenameCollectionModalProps, 'renameCollection' | 'toggleIsVisible'> =>
    state,
  {
    toggleIsVisible,
    renameCollection: renameCollection,
  }
)(RenameCollectionModal);

export default MappedRenameCollectionModal;
