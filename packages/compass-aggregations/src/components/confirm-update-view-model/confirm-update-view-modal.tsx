import React from 'react';
import { FormModal } from '@mongodb-js/compass-components';
import type { UpdateViewState } from '../../modules/update-view';
import { closeConfirmUpdateModal } from '../../modules/update-view';
import { updateView } from '../../modules/update-view';
import { connect } from 'react-redux';

type ConfirmUpdateViewModalProps = {
  updateView: () => void;
  isOpen: boolean;
  closeModal: () => void;
};

const ConfirmUpdateViewModal: React.FunctionComponent<
  ConfirmUpdateViewModalProps
> = ({ updateView, isOpen, closeModal }) => {
  const isSearchCompatibleUpdate = true;
  return (
    <FormModal
      title={'Are you sure you want to update the view?'}
      open={isOpen}
      onSubmit={updateView}
      onCancel={closeModal}
      submitButtonText="Update"
      data-testid="confirm-update-view-modal"
    >
      {isSearchCompatibleUpdate
        ? 'There are search indexes created on this view. Updating the view will result in an ' +
          'index rebuild, which will consume additional resources on your cluster.'
        : 'This update will make the view incompatible with search indexes and will cause all ' +
          'search indexes to fail. Only views containing $addFields, $set or $match stages with ' +
          'the $expr operator are compatible with search indexes.'}
    </FormModal>
  );
};

const mapStateToProps = (state: UpdateViewState) => ({
  isOpen: state.isOpen,
});

const MappedCreateViewModal = connect(mapStateToProps, {
  updateView,
  closeModal: closeConfirmUpdateModal,
})(ConfirmUpdateViewModal);

export default MappedCreateViewModal;
export { ConfirmUpdateViewModal };
