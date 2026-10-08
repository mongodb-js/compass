import {
  Banner,
  Body,
  FormFieldContainer,
  FormModal,
  SpinLoader,
  TextInput,
  css,
  spacing,
  useSyncStateOnPropChange,
  useTranslation,
} from '@mongodb-js/compass-components';
import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { RenameCollectionRootState } from '../../modules/rename-collection/rename-collection';
import {
  submitModal,
  hideModal,
  clearError,
} from '../../modules/rename-collection/rename-collection';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';

export interface RenameCollectionModalProps {
  modalState: 'input-form' | 'confirmation-screen' | 'hidden';
  error: Error | null;
  initialCollectionName: string;
  collections: { name: string }[];
  isRunning: boolean;
  areSavedQueriesAndAggregationsImpacted: boolean;
  hideModal: () => void;
  submitModal: (newCollectionName: string) => void;
  clearError: () => void;
}

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
});

const bannerTextStyles = css({
  marginTop: 0,
  marginBottom: 0,
  '&:not(:last-child)': {
    marginBottom: spacing[200],
  },
});
function ConfirmationModalContent({
  areSavedQueriesAndAggregationsImpacted,
}: {
  areSavedQueriesAndAggregationsImpacted: boolean;
}) {
  const t = useTranslation();
  return (
    <Banner variant="warning" data-testid="rename-collection-modal-warning">
      <p className={bannerTextStyles}>
        {t(
          'databasesCollections.renameCollection.warning',
          'Renaming collection will result in loss of any unsaved queries, filters or aggregation pipelines.'
        )}
      </p>
      {areSavedQueriesAndAggregationsImpacted && (
        <p className={bannerTextStyles}>
          <b>
            {t(
              'databasesCollections.renameCollection.savedImpacted',
              'Additionally, any saved queries or aggregations targeting this collection will need to be remapped to the new namespace.'
            )}
          </b>
        </p>
      )}
    </Banner>
  );
}

function RenameCollectionModal({
  modalState,
  error,
  initialCollectionName,
  collections,
  areSavedQueriesAndAggregationsImpacted,
  isRunning,
  hideModal,
  submitModal,
  clearError,
}: RenameCollectionModalProps) {
  const t = useTranslation();
  const [newName, setNewName] = useState(initialCollectionName);
  const isVisible = useMemo(() => modalState !== 'hidden', [modalState]);
  useSyncStateOnPropChange(() => {
    if (isVisible) {
      setNewName(initialCollectionName);
    }
  }, [isVisible]);
  const onNameConfirmationChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      clearError();
      setNewName(evt?.target.value);
    },
    [setNewName, clearError]
  );
  const onFormSubmit = () => {
    submitModal(newName);
  };

  useTrackOnChange(
    (track: TrackFunction) => {
      if (isVisible) {
        track('Screen', { name: 'rename_collection_modal' }, undefined);
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
  const nameExistsMessage = t(
    'databasesCollections.renameCollection.nameExists',
    'This collection name already exists in this database.'
  );
  const errorMessage = error
    ? // it's conceivable that while a collection is  being renamed, the collections on the server change.  the rename collection
      // modal won't have access to the new collections.  we handle this scenario specially to provide a better error to users
      error.message.match(/target namespace exists/i)
      ? nameExistsMessage
      : error.message
    : doesCollectionExistInDB
      ? nameExistsMessage
      : undefined;

  return (
    <FormModal
      title={
        modalState === 'confirmation-screen'
          ? t(
              'databasesCollections.renameCollection.confirmTitle',
              'Confirm rename collection'
            )
          : t(
              'databasesCollections.renameCollection.title',
              'Rename collection'
            )
      }
      open={modalState !== 'hidden'}
      onSubmit={onFormSubmit}
      onCancel={onHide}
      submitButtonText={
        modalState === 'input-form'
          ? t(
              'databasesCollections.renameCollection.proceed',
              'Proceed to Rename'
            )
          : t(
              'databasesCollections.renameCollection.confirmButton',
              'Yes, rename collection'
            )
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
            label={t(
              'databasesCollections.renameCollection.newName',
              'New collection name'
            )}
            value={newName}
            onChange={onNameConfirmationChange}
          />
        </FormFieldContainer>
      )}
      {modalState === 'confirmation-screen' && (
        <FormFieldContainer>
          <div data-testid="rename-collection-confirmation-screen">
            {t(
              'databasesCollections.renameCollection.confirmQuestion',
              'Are you sure you want to rename "{from}" to "{to}"?',
              { from: initialCollectionName, to: newName }
            )}
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
          <span>
            {t(
              'databasesCollections.renameCollection.renaming',
              'Renaming Collection…'
            )}
          </span>
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
    'submitModal' | 'hideModal' | 'clearError'
  > => state,
  {
    hideModal,
    submitModal,
    clearError,
  }
)(RenameCollectionModal);

export default MappedRenameCollectionModal;
