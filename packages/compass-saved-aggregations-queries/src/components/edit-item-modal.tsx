import React, { useState, useEffect } from 'react';
import {
  Modal,
  H3,
  TextInput,
  spacing,
  Button,
  css,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import type { AggregationQueryItem } from '@mongodb-js/compass-store';
import type { RootState } from '../stores';
import type { UpdateItemAttributes } from '../stores/edit-item';
import { cancelEditItem, updateItem } from '../stores/edit-item';

type EditItemModalProps = {
  isModalOpen: boolean;
  item?: Pick<AggregationQueryItem, 'id' | 'name' | 'type'>;
  onSubmit(id: string, attributes: UpdateItemAttributes): void;
  onCancel: () => void;
};

const formTitleStyles = css({
  marginBottom: spacing[3],
  lineHeight: '25px',
  fontWeight: 'bold',
  fontSize: '24px',
});

const formFooterStyles = css({
  marginTop: spacing[5],
  display: 'flex',
  justifyContent: 'flex-end',
});

const cancelButtonStyles = css({
  marginRight: spacing[2],
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

  const isSubmitDisabled = () => {
    return !name || name === item?.name;
  };

  const onSubmitForm = () => {
    if (!isSubmitDisabled() && item) {
      onSubmit(item.id, { name });
    }
  };

  return (
    <Modal setOpen={onCancel} open={isModalOpen} data-testid="edit-item-modal">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitForm();
        }}
      >
        <H3 className={formTitleStyles}>{`Rename ${item?.type ?? ''}`}</H3>
        <TextInput
          aria-label="Name"
          label="Name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <div className={formFooterStyles}>
          <Button
            className={cancelButtonStyles}
            variant="default"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button disabled={isSubmitDisabled()} variant="primary" type="submit">
            Update
          </Button>
        </div>
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
