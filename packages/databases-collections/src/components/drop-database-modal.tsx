import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  css,
  FormFieldContainer,
  FormModal,
  spacing,
  SpinLoader,
  TextInput
} from '@mongodb-js/compass-components';

import { dropDatabase } from '../modules/drop-database/drop-database';
import { toggleIsVisible } from '../modules/is-visible';
import type { RootState } from '../modules/drop-database/drop-database';

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

type DropDatabaseModalProps = {
  isRunning: boolean;
  isVisible: boolean;
  name: string;
  error: Error | null;
  dropDatabase: () => void;
  toggleIsVisible: (isVisible: boolean) => void;
};

/**
 * The modal to drop a database.
 */
function DropDatabaseModal({
  isRunning,
  isVisible,
  name,
  error,
  dropDatabase,
  toggleIsVisible,
}: DropDatabaseModalProps) {
  const [ nameConfirmation, changeDatabaseNameConfirmation ] = useState('');
  const onNameConfirmationChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    changeDatabaseNameConfirmation(evt.target.value);
  }, [ changeDatabaseNameConfirmation ]);

  const onHide = useCallback(() => {
    toggleIsVisible(false);
  }, [ toggleIsVisible ]);

  const onFormSubmit = useCallback(() => {
    if (name === nameConfirmation) {
      dropDatabase();
    }
  }, [ name, nameConfirmation, dropDatabase]);

  return (
    <FormModal
      title="Drop Database"
      open={isVisible}
      onSubmit={onFormSubmit}
      onCancel={onHide}
      submitButtonText="Drop Database"
      variant="danger"
      submitDisabled={name !== nameConfirmation || isRunning}
      trackingId="drop_database_modal"
      data-testid="drop-database-modal"
    >
      <FormFieldContainer>
        <TextInput
          data-testid="confirm-drop-database-name"
          label={`Type "${name}" to drop the database`}
          value={nameConfirmation}
          onChange={onNameConfirmationChange}
        />
      </FormFieldContainer>
      {error && (
        <Banner
          variant="danger"
        >{error.message}</Banner>
      )}
      {isRunning && (
        <Body className={progressContainerStyles}>
          <SpinLoader /><span>Dropping Database&hellip;</span>
        </Body>
      )}
    </FormModal>
  );
}

/**
 * Map the store state to properties to pass to the components.
 */
const mapStateToProps = (state: RootState) => ({
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  name: state.name,
  error: state.error
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDropDatabaseModal = connect(
  mapStateToProps,
  {
    dropDatabase,
    toggleIsVisible
  },
)(DropDatabaseModal);

export default MappedDropDatabaseModal;
export { DropDatabaseModal };
