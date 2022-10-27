import React, { useState, useEffect } from 'react';
import { FormModal, TextInput } from '@mongodb-js/compass-components';
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

  const isSubmitDisabled = () => {
    return !name || name === item?.name;
  };

  const onSubmitForm = () => {
    if (!isSubmitDisabled() && item) {
      onSubmit(item.id, { name });
    }
  };

  return (
    <FormModal
      open={isModalOpen}
      onCancel={onCancel}
      onSubmit={onSubmitForm}
      submitButtonText="Update"
      submitDisabled={isSubmitDisabled()}
      title={`Rename ${item?.type ?? ''}`}
      data-testid="edit-item-modal"
    >
      <TextInput
        aria-label="Name"
        label="Name"
        name="name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
      />
    </FormModal>
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
