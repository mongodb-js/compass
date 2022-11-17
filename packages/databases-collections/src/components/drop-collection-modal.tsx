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
  TextInput,
} from '@mongodb-js/compass-components';

import { dropCollection } from '../modules/drop-collection/drop-collection';
import { toggleIsVisible } from '../modules/is-visible';
import type { RootState } from '../modules/drop-collection/drop-collection';

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

type DropCollectionModalProps = {
  isRunning: boolean;
  isVisible: boolean;
  name: string;
  error: Error | null;
  dropCollection: () => void;
  toggleIsVisible: (isVisible: boolean) => void;
};

function DropCollectionModal({
  isRunning,
  isVisible,
  name,
  error,
  dropCollection,
  toggleIsVisible,
}: DropCollectionModalProps) {
  const [nameConfirmation, changeCollectionNameConfirmation] = useState('');
  const onNameConfirmationChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      changeCollectionNameConfirmation(evt.target.value);
    },
    [changeCollectionNameConfirmation]
  );

  const onHide = useCallback(() => {
    toggleIsVisible(false);
  }, [toggleIsVisible]);

  const onFormSubmit = useCallback(() => {
    if (name === nameConfirmation) {
      dropCollection();
    }
  }, [name, nameConfirmation, dropCollection]);

  return (
    <FormModal
      title="Drop Collection"
      open={isVisible}
      onSubmit={onFormSubmit}
      onCancel={onHide}
      submitButtonText="Drop Collection"
      variant="danger"
      submitDisabled={name !== nameConfirmation || isRunning}
      trackingId="drop_collection_modal"
      data-testid="drop-collection-modal"
    >
      <FormFieldContainer>
        <TextInput
          data-testid="confirm-drop-collection-name"
          label={`Type "${name}" to drop the collection`}
          value={nameConfirmation}
          onChange={onNameConfirmationChange}
        />
      </FormFieldContainer>
      {error && <Banner variant="danger">{error.message}</Banner>}
      {isRunning && (
        <Body className={progressContainerStyles}>
          <SpinLoader />
          <span>Dropping Collection&hellip;</span>
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
  error: state.error,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDropCollectionModal = connect(mapStateToProps, {
  dropCollection,
  toggleIsVisible,
})(DropCollectionModal);

export default MappedDropCollectionModal;
export { DropCollectionModal };
