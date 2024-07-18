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
import {
  renameCollection,
  hideModal,
  clearError,
} from '../../modules/rename-collection/rename-collection';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';

export interface RenameCollectionModalProps {
  isVisible: boolean;
  error: Error | null;
  initialCollectionName: string;
  collections: { name: string }[];
  isRunning: boolean;
  areSavedQueriesAndAggregationsImpacted: boolean;
  hideModal: () => void;
  renameCollection: (newCollectionName: string) => void;
  clearError: () => void;
}

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

type ModalState = 'input-form' | 'confirmation-screen';

const bannerTextStyles = css({
  marginTop: 0,
  marginBottom: 0,
  '&:not(:last-child)': {
    marginBottom: spacing[2],
  },
});
function ConfirmationModalContent({
  areSavedQueriesAndAggregationsImpacted,
}: {
  areSavedQueriesAndAggregationsImpacted: boolean;
}) {
  return (
    <Banner variant="warning" data-testid="rename-collection-modal-warning">
      <p className={bannerTextStyles}>
        Renaming collection will result in loss of any unsaved queries, filters
        or aggregation pipelines.
      </p>
      {areSavedQueriesAndAggregationsImpacted && (
        <p className={bannerTextStyles}>
          <b>
            Additionally, any saved queries or aggregations targeting this
            collection will need to be remapped to the new namespace.
          </b>
        </p>
      )}
    </Banner>
  );
}

function RenameCollectionModal({
  isVisible,
  error,
  initialCollectionName,
  collections,
  areSavedQueriesAndAggregationsImpacted,
  isRunning,
  hideModal,
  renameCollection,
  clearError,
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
      clearError();
      setNewName(evt?.target.value);
    },
    [setNewName, clearError]
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
    (track: TrackFunction) => {
      if (isVisible) {
        track('Screen', { name: 'rename_collection_modal' });
      }
    },
    [isVisible],
    undefined
  );

  const onHide = useCallback(() => {
    hideModal();
  }, [hideModal]);

  const doesCollectionExistInDB =
    collections.filter(
      ({ name }) => name !== initialCollectionName && name === newName
    ).length > 0;
  const errorMessage = error
    ? // it's conceivable that while a collection is  being renamed, the collections on the server change.  the rename collection
      // modal won't have access to the new collections.  we handle this scenario specially to provide a better error to users
      error.message.match(/target namespace exists/i)
      ? 'This collection name already exists in this database.'
      : error.message
    : doesCollectionExistInDB
    ? 'This collection name already exists in this database.'
    : undefined;

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
        modalState === 'input-form' &&
        (newName === '' ||
          initialCollectionName === newName ||
          doesCollectionExistInDB)
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
        <FormFieldContainer>
          <div data-testid="rename-collection-confirmation-screen">
            {`Are you sure you want to rename "${initialCollectionName}" to "${newName}"?`}
          </div>
        </FormFieldContainer>
      )}
      {errorMessage && modalState === 'input-form' && (
        <Banner variant="danger" data-testid="rename-collection-modal-error">
          {errorMessage}
        </Banner>
      )}
      {modalState === 'confirmation-screen' && (
        <ConfirmationModalContent
          areSavedQueriesAndAggregationsImpacted={
            areSavedQueriesAndAggregationsImpacted
          }
        />
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
  ): Omit<
    RenameCollectionModalProps,
    'renameCollection' | 'hideModal' | 'clearError'
  > => state,
  {
    hideModal,
    renameCollection,
    clearError,
  }
)(RenameCollectionModal);

export default MappedRenameCollectionModal;
