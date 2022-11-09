import React, { useCallback } from 'react';
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

import { changeCollectionName } from '../modules/drop-collection/name';
import { changeCollectionNameConfirmation } from '../modules/drop-collection/name-confirmation';
import { dropCollection } from '../modules/drop-collection';
import { toggleIsVisible } from '../modules/is-visible';

const progressContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

type DropCollectionModalProps = {
  isRunning: boolean;
  isVisible: boolean;
  name: string;
  nameConfirmation: string;
  error?: Error;
  changeCollectionNameConfirmation: (name: string) => void;
  dropCollection: () => void;
  toggleIsVisible: (isVisible: boolean) => void;
};

function DropCollectionModal({
  isRunning,
  isVisible,
  name,
  nameConfirmation,
  error,
  changeCollectionNameConfirmation,
  dropCollection,
  toggleIsVisible,
}: DropCollectionModalProps) {
  const onNameConfirmationChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    changeCollectionNameConfirmation(evt.target.value);
  }, [ changeCollectionNameConfirmation ]);

  const onHide = useCallback(() => {
    toggleIsVisible(false);
  }, [ toggleIsVisible ]);

  /**
   * When user hits enter to submit the form we prevent the default behaviour.
   */
  const onFormSubmit = useCallback(() => {
    if (name === nameConfirmation) {
      dropCollection();
    }
  }, [ name, nameConfirmation, dropCollection]);

  return (
    <FormModal
      title="Drop Collection"
      open={isVisible}
      onSubmit={onFormSubmit}
      onCancel={onHide}
      submitButtonText="Drop Collection"
      variant="danger"
      submitDisabled={name !== nameConfirmation}
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
      {error && (
        <Banner
          variant="danger"
        >{error.message}</Banner>
      )}
      {isRunning && (
        <Body className={progressContainerStyles}>
          <SpinLoader /><span>Dropping Collection&hellip;</span>
        </Body>
      )}
    </FormModal>
  );
}

/**
 * Map the store state to properties to pass to the components.
 */
const mapStateToProps = (state: {
  isRunning: boolean;
  isVisible: boolean;
  name: string;
  nameConfirmation: string;
  error?: Error;
}) => ({
  isRunning: state.isRunning,
  isVisible: state.isVisible,
  name: state.name,
  nameConfirmation: state.nameConfirmation,
  error: state.error
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedDropCollectionModal = connect(
  mapStateToProps,
  {
    changeCollectionName,
    changeCollectionNameConfirmation,
    dropCollection,
    toggleIsVisible
  },
)(DropCollectionModal);

export default MappedDropCollectionModal;
export { DropCollectionModal };
