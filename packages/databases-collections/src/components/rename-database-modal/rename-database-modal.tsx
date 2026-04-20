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
} from '@mongodb-js/compass-components';
import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { RenameDatabaseRootState } from '../../modules/rename-database/rename-database';
import {
  submitModal,
  hideModal,
  clearError,
} from '../../modules/rename-database/rename-database';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';

export interface RenameDatabaseModalProps {
  modalState: 'input-form' | 'confirmation-screen' | 'hidden';
  error: Error | null;
  initialDatabaseName: string;
  databases: { name: string }[];
  collectionCount: number;
  hasViews: boolean;
  areSavedQueriesAndAggregationsImpacted: boolean;
  isRunning: boolean;
  hideModal: () => void;
  submitModal: (newDatabaseName: string) => void;
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

function InputFormWarning({
  collectionCount,
  hasViews,
}: {
  collectionCount: number;
  hasViews: boolean;
}) {
  return (
    <Banner variant="warning" data-testid="rename-database-modal-input-warning">
      <p className={bannerTextStyles}>
        MongoDB does not support renaming a database natively. Compass will
        move each of the {collectionCount} collection
        {collectionCount === 1 ? '' : 's'} to the new database name and then
        drop the original database. This operation is not atomic and can take a
        long time for large databases.
      </p>
      {hasViews && (
        <p className={bannerTextStyles}>
          <b>
            This database contains views, which cannot be renamed automatically.
            Drop or recreate them in the new database before continuing.
          </b>
        </p>
      )}
    </Banner>
  );
}

function ConfirmationModalContent({
  areSavedQueriesAndAggregationsImpacted,
}: {
  areSavedQueriesAndAggregationsImpacted: boolean;
}) {
  return (
    <Banner variant="warning" data-testid="rename-database-modal-warning">
      <p className={bannerTextStyles}>
        Renaming the database will result in loss of any unsaved queries,
        filters or aggregation pipelines targeting its collections.
      </p>
      {areSavedQueriesAndAggregationsImpacted && (
        <p className={bannerTextStyles}>
          <b>
            Additionally, any saved queries or aggregations targeting this
            database will need to be remapped to the new namespace.
          </b>
        </p>
      )}
    </Banner>
  );
}

function RenameDatabaseModal({
  modalState,
  error,
  initialDatabaseName,
  databases,
  collectionCount,
  hasViews,
  areSavedQueriesAndAggregationsImpacted,
  isRunning,
  hideModal,
  submitModal,
  clearError,
}: RenameDatabaseModalProps) {
  const [newName, setNewName] = useState(initialDatabaseName);
  const isVisible = useMemo(() => modalState !== 'hidden', [modalState]);
  useSyncStateOnPropChange(() => {
    if (isVisible) {
      setNewName(initialDatabaseName);
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
        track('Screen', { name: 'rename_database_modal' }, undefined);
      }
    },
    [isVisible],
    undefined
  );

  const onHide = useCallback(() => {
    hideModal();
  }, [hideModal]);

  const isInvalidName =
    newName.includes('.') || newName.includes('$') || newName.includes(' ');

  const doesDatabaseExist =
    databases.filter(
      ({ name }) => name !== initialDatabaseName && name === newName
    ).length > 0;

  const errorMessage = error
    ? error.message.match(/target namespace exists/i)
      ? 'A collection with this name already exists in the target database.'
      : error.message
    : doesDatabaseExist
    ? 'A database with this name already exists.'
    : isInvalidName && newName !== ''
    ? 'Database names cannot contain ".", "$", or spaces.'
    : undefined;

  return (
    <FormModal
      title={
        modalState === 'confirmation-screen'
          ? 'Confirm rename database'
          : 'Rename database'
      }
      open={modalState !== 'hidden'}
      onSubmit={onFormSubmit}
      onCancel={onHide}
      submitButtonText={
        modalState === 'input-form'
          ? 'Proceed to Rename'
          : 'Yes, rename database'
      }
      variant={modalState === 'input-form' ? 'primary' : 'danger'}
      submitDisabled={
        modalState === 'input-form' &&
        (newName === '' ||
          initialDatabaseName === newName ||
          doesDatabaseExist ||
          isInvalidName ||
          hasViews)
      }
      data-testid="rename-database-modal"
    >
      {modalState === 'input-form' && (
        <>
          <FormFieldContainer>
            <TextInput
              data-testid="rename-database-name-input"
              label="New database name"
              value={newName}
              onChange={onNameConfirmationChange}
            />
          </FormFieldContainer>
          <InputFormWarning
            collectionCount={collectionCount}
            hasViews={hasViews}
          />
        </>
      )}
      {modalState === 'confirmation-screen' && (
        <FormFieldContainer>
          <div data-testid="rename-database-confirmation-screen">
            {`Are you sure you want to rename "${initialDatabaseName}" to "${newName}"? This will move ${collectionCount} collection${
              collectionCount === 1 ? '' : 's'
            } and then drop "${initialDatabaseName}".`}
          </div>
        </FormFieldContainer>
      )}
      {errorMessage && modalState === 'input-form' && (
        <Banner variant="danger" data-testid="rename-database-modal-error">
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
          <span>Renaming Database&hellip;</span>
        </Body>
      )}
    </FormModal>
  );
}

const MappedRenameDatabaseModal = connect(
  (
    state: RenameDatabaseRootState
  ): Omit<
    RenameDatabaseModalProps,
    'submitModal' | 'hideModal' | 'clearError'
  > => state,
  {
    hideModal,
    submitModal,
    clearError,
  }
)(RenameDatabaseModal);

export default MappedRenameDatabaseModal;
