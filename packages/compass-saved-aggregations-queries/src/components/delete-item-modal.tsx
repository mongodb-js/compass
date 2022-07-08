import React from 'react';
import { connect } from 'react-redux';
import { ConfirmationModal, Description } from '@mongodb-js/compass-components';
import type { RootState } from '../stores';
import { deleteItemConfirm, deleteItemCancel } from '../stores/delete-item';
import type { AggregationQueryItem } from '@mongodb-js/compass-store';

type DeleteItemModalProps = {
  isOpen: boolean;
  itemType: AggregationQueryItem['type'] | null;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
};

const DeleteItemModal: React.FunctionComponent<DeleteItemModalProps> = ({
  isOpen,
  itemType,
  onDeleteCancel,
  onDeleteConfirm,
}) => {
  const title = `Are you sure you want to delete your ${
    itemType === 'query' ? 'query' : 'aggregation'
  }?`;
  return (
    <ConfirmationModal
      data-testid="delete-item-modal"
      open={isOpen}
      onCancel={onDeleteCancel}
      onConfirm={onDeleteConfirm}
      title={title}
      buttonText="Delete"
      variant="danger"
    >
      <Description>This action can not be undone.</Description>
    </ConfirmationModal>
  );
};

export default connect<
  Pick<DeleteItemModalProps, 'isOpen' | 'itemType'>,
  { onDeleteConfirm(): void; onDeleteCancel(): void },
  Record<string, never>,
  RootState
>(
  (state) => {
    return {
      isOpen: !!state.deleteItem.id,
      itemType:
        state.savedItems.items.find((item) => item.id === state.deleteItem.id)
          ?.type ?? null,
    };
  },
  { onDeleteConfirm: deleteItemConfirm, onDeleteCancel: deleteItemCancel }
)(DeleteItemModal);
