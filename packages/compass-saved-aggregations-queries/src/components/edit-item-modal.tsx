import React, { useState, useEffect } from 'react';
import { ConfirmationModal, TextInput } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import type { RootState } from '../stores';
import type { UpdateItemAttributes } from '../stores/edit-item';
import type { Item } from '../stores/aggregations-queries-items';
import { cancelEditItem, updateItem } from '../stores/edit-item';

type EditItemModalProps = {
  isModalOpen: boolean;
  item?: Pick<Item, 'id' | 'name' | 'type'>;
  onSubmit(id: string, attributes: UpdateItemAttributes): void;
  onCancel: () => void;
};

const EditItemModal: React.FunctionComponent<EditItemModalProps> = ({
  isModalOpen,
  item,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(item?.name ?? '');
  useEffect(() => {
    setName(item?.name ?? '');
  }, [item]);

  if (!item) {
    return <></>;
  }

  const title = `Edit ${item.type === 'query' ? 'query' : 'aggregation'}`;
  const onConfirm = () => {
    return onSubmit(item.id, { name });
  };
  return (
    <ConfirmationModal
      open={isModalOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
      buttonText="Update"
      submitDisabled={!name || name === item.name}
    >
      <TextInput
        label="Name"
        placeholder={title}
        onChange={(event) => {
          setName(event.target.value);
        }}
        value={name}
      />
    </ConfirmationModal>
  );
};

const mapState: MapStateToProps<
  Pick<EditItemModalProps, 'isModalOpen' | 'item'>,
  Record<string, never>,
  RootState
> = ({ editItem: { id }, savedItems: { items } }) => {
  return {
    isModalOpen: Boolean(id),
    item: items.find((x) => x.id === id),
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<EditItemModalProps, 'onSubmit' | 'onCancel'>,
  Record<string, never>
> = {
  onSubmit: updateItem,
  onCancel: cancelEditItem,
};

export default connect(mapState, mapDispatch)(EditItemModal);
