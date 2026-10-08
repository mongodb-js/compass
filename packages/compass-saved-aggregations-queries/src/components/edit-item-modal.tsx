import React, { useState } from 'react';
import {
  FormModal,
  TextInput,
  useSyncStateOnPropChange,
  useTranslation,
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

const EditItemModal: React.FunctionComponent<EditItemModalProps> = ({
  isModalOpen,
  item,
  onSubmit,
  onCancel,
}) => {
  const t = useTranslation();
  const title =
    item?.type === 'query'
      ? t('savedQueries.edit.titleQuery', 'Rename query')
      : item?.type === 'aggregation'
        ? t('savedQueries.edit.titleAggregation', 'Rename aggregation')
        : t('savedQueries.edit.title', 'Rename {type}', {
            type: item?.type ?? '',
          });
  const [name, setName] = useState(item?.name ?? '');
  useSyncStateOnPropChange(() => {
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
      submitButtonText={t('savedQueries.edit.update', 'Update')}
      submitDisabled={isSubmitDisabled()}
      title={title}
      data-testid="edit-item-modal"
    >
      <TextInput
        aria-label={t('savedQueries.edit.name', 'Name')}
        label={t('savedQueries.edit.name', 'Name')}
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
