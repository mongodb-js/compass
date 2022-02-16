import React, { useState, useEffect } from 'react';
import {
  Modal,
  H3,
  TextInput,
  spacing,
  css,
  FormFooter,
} from '@mongodb-js/compass-components';
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

const modalStyles = css({
  paddingBottom: 0,
});

const formTitleStyles = css({
  marginBottom: spacing[3],
});

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

  const isSubmitDisabled = () => {
    return !name || name === item.name;
  };

  const onSubmitForm = () => {
    if (!isSubmitDisabled()) {
      onSubmit(item.id, { name });
    }
  };

  return (
    <Modal
      className={modalStyles}
      setOpen={onCancel}
      open={isModalOpen}
      data-testid="edit-item-modal"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitForm();
        }}
      >
        <H3 className={formTitleStyles}>{`Edit ${item.type}`}</H3>
        <TextInput
          aria-label="Name"
          label="Name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <FormFooter
          onCancel={onCancel}
          primaryButton={{
            disabled: isSubmitDisabled(),
            text: 'Submit',
            variant: 'primary',
            onClick: (
              event: React.MouseEvent<HTMLButtonElement, MouseEvent>
            ) => {
              event.preventDefault();
              onSubmitForm();
            },
          }}
        />
      </form>
    </Modal>
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
