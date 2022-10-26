import React from 'react';
import {
  FormModal,
  Option,
  Select,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import type { RootState } from '../stores';
import {
  closeModal,
  openSelectedItem,
  selectCollection,
  selectDatabase,
} from '../stores/open-item';

type AsyncItemsSelectProps = {
  name: string;
  label: string;
  items: string[];
  selectedItem: string | null;
  isLoading: boolean;
  onChange(item: string): void;
};

const select = css({
  // Working around leafygreen Select issues
  // See https://jira.mongodb.org/browse/PD-1677 and https://jira.mongodb.org/browse/PD-1764
  button: {
    zIndex: 999,
  },
});

const AsyncItemsSelect: React.FunctionComponent<AsyncItemsSelectProps> = ({
  name,
  label,
  items,
  selectedItem,
  isLoading,
  onChange,
}) => {
  return (
    <Select
      name={name}
      label={label}
      value={selectedItem ?? ''}
      onChange={onChange}
      disabled={isLoading}
      usePortal={false}
      className={select}
    >
      {items.map((item) => (
        <Option key={item} value={item}>
          {item}
        </Option>
      ))}
    </Select>
  );
};

const mapDatabaseState: MapStateToProps<
  Pick<AsyncItemsSelectProps, 'items' | 'selectedItem' | 'isLoading'>,
  Pick<AsyncItemsSelectProps, 'name' | 'label'>,
  RootState
> = ({ openItem: { databases, databasesStatus, selectedDatabase } }) => {
  return {
    items: databases,
    selectedItem: selectedDatabase,
    isLoading: ['initial', 'fetching'].includes(databasesStatus),
  };
};

const DatabaseSelect = connect(mapDatabaseState, { onChange: selectDatabase })(
  AsyncItemsSelect
);

const mapCollectionState: MapStateToProps<
  Pick<AsyncItemsSelectProps, 'items' | 'selectedItem' | 'isLoading'>,
  Pick<AsyncItemsSelectProps, 'name' | 'label'>,
  RootState
> = ({ openItem: { collections, collectionsStatus, selectedCollection } }) => {
  return {
    items: collections,
    selectedItem: selectedCollection,
    isLoading: ['initial', 'fetching'].includes(collectionsStatus),
  };
};

const CollectionSelect = connect(mapCollectionState, {
  onChange: selectCollection,
})(AsyncItemsSelect);

type OpenItemModalProps = {
  namespace: string;
  itemType: string;
  itemName: string;
  isModalOpen: boolean;
  isSubmitDisabled: boolean;
  onSubmit(): void;
  onClose(): void;
};

const modalContent = css({
  display: 'grid',
  gridTemplateAreas: `
    'description description'
    'database collection'
  `,
  gridAutoColumns: '1fr',
  rowGap: spacing[4],
  columnGap: spacing[3],
});

const description = css({
  gridArea: 'description',
});

const databaseSelect = css({
  gridArea: 'database',
});

const collectionSelect = css({
  gridArea: 'collection',
});

const OpenItemModal: React.FunctionComponent<OpenItemModalProps> = ({
  namespace,
  itemType,
  itemName,
  isModalOpen,
  isSubmitDisabled,
  onClose,
  onSubmit,
}) => {
  return (
    <FormModal
      open={isModalOpen}
      onCancel={onClose}
      onSubmit={onSubmit}
      title="Select a Namespace"
      submitButtonText="Open"
      submitDisabled={isSubmitDisabled}
      scroll={false} // this is so that the selects can hang over the footer and out of the modal
      data-testid="open-item-modal"
    >
      <div className={modalContent}>
        <div className={description}>
          The namespace <strong>{namespace}</strong> for the saved {itemType}{' '}
          <strong>{itemName}</strong> doesn&rsquo;t exist in&nbsp;the current
          cluster. Please select another namespace to&nbsp;open saved {itemType}
          .
        </div>
        <div className={databaseSelect} data-testid="database-select-field">
          <DatabaseSelect name="database" label="Database"></DatabaseSelect>
        </div>
        <div className={collectionSelect} data-testid="collection-select-field">
          <CollectionSelect
            name="collection"
            label="Collection"
          ></CollectionSelect>
        </div>
      </div>
    </FormModal>
  );
};

const mapState: MapStateToProps<
  Pick<
    OpenItemModalProps,
    'isModalOpen' | 'isSubmitDisabled' | 'namespace' | 'itemType' | 'itemName'
  >,
  Record<string, never>,
  RootState
> = ({
  openItem: {
    isModalOpen,
    selectedDatabase,
    selectedCollection,
    selectedItem: item,
  },
}) => {
  return {
    isModalOpen,
    isSubmitDisabled: !(selectedDatabase && selectedCollection),
    namespace: `${item?.database ?? ''}.${item?.collection ?? ''}`,
    itemName: item?.name ?? '',
    itemType: item?.type ?? '',
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<OpenItemModalProps, 'onSubmit' | 'onClose'>,
  Record<string, never>
> = {
  onSubmit: openSelectedItem,
  onClose: closeModal,
};

export default connect(mapState, mapDispatch)(OpenItemModal);
