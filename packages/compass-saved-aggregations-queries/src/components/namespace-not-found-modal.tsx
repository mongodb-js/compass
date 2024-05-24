import React, { useCallback } from 'react';
import {
  Checkbox,
  FormModal,
  Option,
  Select,
  css,
  cx,
  spacing,
} from '@mongodb-js/compass-components';
import {
  ColorCircleGlyph,
  useConnectionColor,
} from '@mongodb-js/connection-form';
import { connect } from 'react-redux';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import type { RootState } from '../stores';
import {
  type State as OpenItemState,
  closeModal,
  connectionSelected,
  openSelectedItem,
  selectCollection,
  selectDatabase,
  updateItemNamespaceChecked,
} from '../stores/open-item';

type SelectProps = {
  name: string;
  label: string;
  selectedItem: string | null;
  onChange(item: string): void;
};

type AsyncItemsSelectProps = SelectProps & {
  items: string[];
  isLoading: boolean;
};

type ConnectionSelectProps = SelectProps & {
  items: OpenItemState['connections'];
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

const mapConnectionState: MapStateToProps<
  Pick<ConnectionSelectProps, 'selectedItem' | 'items'>,
  Pick<ConnectionSelectProps, 'name' | 'label'>,
  RootState
> = ({ openItem: { selectedConnection, connections } }) => {
  return {
    items: connections,
    selectedItem: selectedConnection,
  };
};

const ConnectionSelect = connect(mapConnectionState, {
  onChange: connectionSelected,
})(
  ({
    name,
    label,
    items,
    selectedItem,
    onChange: _onChange,
  }: ConnectionSelectProps) => {
    const { connectionColorToHex } = useConnectionColor();
    const onChange = useCallback(
      (connectionId: string) => _onChange(connectionId),
      [_onChange]
    );
    return (
      <Select
        name={name}
        label={label}
        value={selectedItem ?? ''}
        onChange={onChange}
        usePortal={false}
        className={select}
        dropdownWidthBasis="option"
      >
        {items.map(({ id, name, color }) => {
          const glyph =
            color && color !== 'no-color' ? (
              <ColorCircleGlyph hexColor={connectionColorToHex(color)} />
            ) : undefined;
          return (
            <Option key={id} value={id} glyph={glyph}>
              {name}
            </Option>
          );
        })}
      </Select>
    );
  }
);

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

type NamespaceNotFoundModalProps = {
  namespace: string;
  itemType: string;
  itemName: string;
  isModalOpen: boolean;
  isSubmitDisabled: boolean;
  updateItemNamespace: boolean;
  connections: { id: string; name: string }[];
  onSubmit(): void;
  onClose(): void;
  onUpdateNamespaceChecked(checked: boolean): void;
};

const modalContent = css({
  display: 'grid',
  gridAutoColumns: '1fr',
  rowGap: spacing[4],
  columnGap: spacing[3],
});

const contentWithoutConnectionSelect = cx(
  modalContent,
  css({
    gridTemplateAreas: `
    'description description'
    'database collection'
    'checkbox checkbox'
  `,
  })
);

const contentWithConnectionSelect = cx(
  modalContent,
  css({
    gridTemplateAreas: `
    'description description description'
    'connection database collection'
    'checkbox checkbox checkbox'
  `,
  })
);

const description = css({
  gridArea: 'description',
});

const connectionSelect = css({
  gridArea: 'connection',
});

const databaseSelect = css({
  gridArea: 'database',
});

const collectionSelect = css({
  gridArea: 'collection',
});

const checkbox = css({
  gridArea: 'checkbox',
});

const NamespaceNotFoundModal: React.FunctionComponent<
  NamespaceNotFoundModalProps
> = ({
  namespace,
  itemType,
  itemName,
  isModalOpen,
  isSubmitDisabled,
  updateItemNamespace,
  connections,
  onClose,
  onSubmit,
  onUpdateNamespaceChecked,
}) => {
  const showConnectionSelect = connections.length > 1;

  return (
    <FormModal
      open={isModalOpen}
      onCancel={onClose}
      onSubmit={() => onSubmit()}
      title={
        showConnectionSelect
          ? 'Select a Connection and Namespace'
          : 'Select a Namespace'
      }
      submitButtonText="Open"
      submitDisabled={isSubmitDisabled}
      scroll={false} // this is so that the selects can hang over the footer and out of the modal
      data-testid="open-item-modal"
    >
      <div
        className={
          showConnectionSelect
            ? contentWithConnectionSelect
            : contentWithoutConnectionSelect
        }
      >
        <div className={description}>
          {showConnectionSelect ? (
            <>
              The namespace <strong>{namespace}</strong> for the saved{' '}
              {itemType} <strong>{itemName}</strong> doesn&rsquo;t exist
              in&nbsp;any of the active connections. Please select another
              target to&nbsp;open saved {itemType}
            </>
          ) : (
            <>
              The namespace <strong>{namespace}</strong> for the saved{' '}
              {itemType} <strong>{itemName}</strong> doesn&rsquo;t exist
              in&nbsp;the current connection. Please select another namespace
              to&nbsp;open saved {itemType}.
            </>
          )}
        </div>
        {showConnectionSelect && (
          <div
            className={connectionSelect}
            data-testid="connection-select-field"
          >
            <ConnectionSelect
              name="connection"
              label="Connection"
            ></ConnectionSelect>
          </div>
        )}
        <div className={databaseSelect} data-testid="database-select-field">
          <DatabaseSelect name="database" label="Database"></DatabaseSelect>
        </div>
        <div className={collectionSelect} data-testid="collection-select-field">
          <CollectionSelect
            name="collection"
            label="Collection"
          ></CollectionSelect>
        </div>
        <Checkbox
          className={checkbox}
          checked={updateItemNamespace}
          onChange={(event) => {
            onUpdateNamespaceChecked(event.target.checked);
          }}
          label={`Update this ${itemType} with the newly selected namespace`}
          data-testid="update-query-aggregation-checkbox"
        />
      </div>
    </FormModal>
  );
};

const mapState: MapStateToProps<
  Pick<
    NamespaceNotFoundModalProps,
    | 'isModalOpen'
    | 'isSubmitDisabled'
    | 'namespace'
    | 'itemType'
    | 'itemName'
    | 'updateItemNamespace'
    | 'connections'
  >,
  Record<string, never>,
  RootState
> = ({
  openItem: {
    openedModal,
    selectedDatabase,
    selectedCollection,
    selectedItem: item,
    updateItemNamespace,
    connections,
  },
}) => {
  return {
    isModalOpen: openedModal === 'namespace-not-found-modal',
    isSubmitDisabled: !(selectedDatabase && selectedCollection),
    namespace: `${item?.database ?? ''}.${item?.collection ?? ''}`,
    itemName: item?.name ?? '',
    itemType: item?.type ?? '',
    updateItemNamespace,
    connections,
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<
    NamespaceNotFoundModalProps,
    'onSubmit' | 'onClose' | 'onUpdateNamespaceChecked'
  >,
  Record<string, never>
> = {
  onSubmit: openSelectedItem,
  onClose: closeModal,
  onUpdateNamespaceChecked: updateItemNamespaceChecked,
};

export default connect(mapState, mapDispatch)(NamespaceNotFoundModal);
