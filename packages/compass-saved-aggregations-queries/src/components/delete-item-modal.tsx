import React from 'react';
import { ConfirmationModal, Description } from '@mongodb-js/compass-components';
import type { Item } from '../stores/aggregations-queries-items';

type DeleteItemModalProps = {
  isOpen: boolean;
  itemType: Item['type'];
  onClose: () => void;
  onDelete: () => void;
};

const DeleteItemModal: React.FunctionComponent<DeleteItemModalProps> = ({
  isOpen,
  itemType,
  onClose,
  onDelete,
}) => {
  const title = `Are you sure you want to delete your ${
    itemType === 'query' ? 'query' : 'aggregation'
  }?`;
  return (
    <ConfirmationModal
      data-testid="delete-item-modal"
      open={isOpen}
      onCancel={onClose}
      onConfirm={onDelete}
      title={title}
      buttonText="Delete"
      variant="danger"
    >
      <Description>This action can not be undone.</Description>
    </ConfirmationModal>
  );
};

export default DeleteItemModal;
