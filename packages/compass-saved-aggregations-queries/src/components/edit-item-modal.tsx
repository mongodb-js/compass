import React from 'react';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import type { RootState } from '../stores';
import { updateItem } from '../stores/edit-item';
import type { UpdateAttributes } from '../stores/edit-item';

type OpenItemModalProps = {
  isModalOpen: boolean;
  onSubmit(id: string, attributes: UpdateAttributes): void;
};

const OpenItemModal: React.FunctionComponent<OpenItemModalProps> = ({
  isModalOpen,
  onSubmit,
}) => {
  return (
    <ConfirmationModal open={isModalOpen} title="Update" buttonText="Open">
      <p></p>
    </ConfirmationModal>
  );
};

const mapState: MapStateToProps<
  Pick<OpenItemModalProps, 'isModalOpen'>,
  Record<string, never>,
  RootState
> = ({ editItem: { id } }) => {
  return {
    isModalOpen: Boolean(id),
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<OpenItemModalProps, 'onSubmit'>,
  Record<string, never>
> = {
  onSubmit: updateItem,
};

export default connect(mapState, mapDispatch)(OpenItemModal);
