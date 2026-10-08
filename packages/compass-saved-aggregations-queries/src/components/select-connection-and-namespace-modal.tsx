import React, { useCallback, useMemo } from 'react';
import {
  Checkbox,
  FormModal,
  Option,
  Select,
  css,
  cx,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';
import {
  ColorCircleGlyph,
  useConnectionColor,
} from '@mongodb-js/connection-form';
import { connect } from 'react-redux';
import { useItemTypeLabel } from '../hooks/use-item-type-label';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import type { RootState } from '../stores';
import {
  type State as OpenItemState,
  closeModal,
  openSelectedItem,
  connectionSelected,
  databaseSelected,
  collectionSelected,
  updateItemNamespaceChecked,
} from '../stores/open-item';

const selectStyles = css({
  // Working around leafygreen Select issues
  // See https://jira.mongodb.org/browse/PD-1677 and https://jira.mongodb.org/browse/PD-1764
  button: {
    zIndex: 999,
  },
});

type AsyncItemsSelectProps = {
  name: string;
  label: string;
  items: string[];
  isLoading: boolean;
  selectedItem: string | null;
  onChange(item: string): void;
};

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
      className={selectStyles}
      data-testid={`${name}-select`}
    >
      {items.map((item) => (
        <Option key={item} value={item}>
          {item}
        </Option>
      ))}
    </Select>
  );
};

type ConnectionSelectProps = {
  items: OpenItemState['connections'];
  selectedItem: string | null;
  onChange(item: string): void;
};

const mapConnectionState: MapStateToProps<
  Pick<ConnectionSelectProps, 'selectedItem' | 'items'>,
  Record<string, never>,
  RootState
> = ({ openItem: { selectedConnection, connections } }) => {
  return {
    items: connections,
    selectedItem: selectedConnection,
  };
};

const ConnectionSelect = connect(mapConnectionState, {
  onChange: connectionSelected,
})(({ items, selectedItem, onChange: _onChange }: ConnectionSelectProps) => {
  const t = useTranslation();
  const { connectionColorToHex } = useConnectionColor();
  const onChange = useCallback(
    (connectionId: string) => _onChange(connectionId),
    [_onChange]
  );
  return (
    <Select
      name="connection"
      label={t('savedQueries.selectNamespace.connection', 'Connection')}
      value={selectedItem ?? ''}
      onChange={onChange}
      className={selectStyles}
      dropdownWidthBasis="option"
      data-testid="connection-select"
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
});

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

const DatabaseSelect = connect(mapDatabaseState, {
  onChange: databaseSelected,
})(AsyncItemsSelect);

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
  onChange: collectionSelected,
})(AsyncItemsSelect);

const modalContent = css({
  display: 'grid',
  gridAutoColumns: '1fr',
  rowGap: spacing[600],
  columnGap: spacing[400],
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

const descriptionStyles = css({
  gridArea: 'description',
});

const connectionSelectStyles = css({
  gridArea: 'connection',
});

const databaseSelectStyles = css({
  gridArea: 'database',
});

const collectionSelectStyles = css({
  gridArea: 'collection',
});

const checkboxStyles = css({
  gridArea: 'checkbox',
});

type SelectConnectionAndNamespaceModal = {
  openedModal: OpenItemState['openedModal'];
  namespace: string;
  itemName: string;
  itemType: string;
  showConnectionSelect: boolean;
  isSubmitDisabled: boolean;
  updateItemNamespace: boolean;
  onSubmit(): void;
  onClose(): void;
  onUpdateNamespaceChecked(checked: boolean): void;
};

const SelectConnectionAndNamespaceModal: React.FunctionComponent<
  SelectConnectionAndNamespaceModal
> = ({
  openedModal,
  namespace,
  itemName,
  itemType,
  showConnectionSelect,
  isSubmitDisabled,
  updateItemNamespace,
  onSubmit,
  onClose,
  onUpdateNamespaceChecked,
}) => {
  const t = useTranslation();
  const itemTypeLabel = useItemTypeLabel(itemType);
  const { isOpened, title, description } = useMemo(() => {
    const namespaceNotFoundDescription = showConnectionSelect ? (
      <>
        {t('savedQueries.selectNamespace.namespace', 'The namespace')}{' '}
        <strong>{namespace}</strong>{' '}
        {t(
          'savedQueries.selectNamespace.forSaved',
          'for the saved {itemType}',
          {
            itemType: itemTypeLabel,
          }
        )}{' '}
        <strong>{itemName}</strong>{' '}
        {t(
          'savedQueries.selectNamespace.notFoundAnyConnection',
          'doesn\u2019t exist in\u00a0any of the active connections. Please select another target to\u00a0open saved {itemType}',
          { itemType: itemTypeLabel }
        )}
      </>
    ) : (
      <>
        {t('savedQueries.selectNamespace.namespace', 'The namespace')}{' '}
        <strong>{namespace}</strong>{' '}
        {t(
          'savedQueries.selectNamespace.forSaved',
          'for the saved {itemType}',
          {
            itemType: itemTypeLabel,
          }
        )}{' '}
        <strong>{itemName}</strong>{' '}
        {t(
          'savedQueries.selectNamespace.notFoundCurrentConnection',
          'doesn\u2019t exist in\u00a0the current connection. Please select another namespace to\u00a0open saved {itemType}.',
          { itemType: itemTypeLabel }
        )}
      </>
    );

    return {
      isOpened:
        openedModal === 'namespace-not-found-modal' ||
        openedModal === 'select-connection-and-namespace-modal',
      title: showConnectionSelect
        ? t(
            'savedQueries.selectNamespace.titleConnectionAndNamespace',
            'Select a Connection and Namespace'
          )
        : t(
            'savedQueries.selectNamespace.titleNamespace',
            'Select a Namespace'
          ),
      description:
        openedModal === 'namespace-not-found-modal'
          ? namespaceNotFoundDescription
          : null,
    };
  }, [
    showConnectionSelect,
    openedModal,
    itemName,
    itemTypeLabel,
    namespace,
    t,
  ]);

  return (
    <FormModal
      open={isOpened}
      onCancel={onClose}
      onSubmit={() => onSubmit()}
      title={title}
      submitButtonText={t('savedQueries.selectNamespace.runQuery', 'Run Query')}
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
        {description && (
          <div data-testid="description" className={descriptionStyles}>
            {description}
          </div>
        )}
        {showConnectionSelect && (
          <div
            className={connectionSelectStyles}
            data-testid="connection-select-field"
          >
            <ConnectionSelect />
          </div>
        )}
        <div
          className={databaseSelectStyles}
          data-testid="database-select-field"
        >
          <DatabaseSelect
            name="database"
            label={t('savedQueries.selectNamespace.database', 'Database')}
          ></DatabaseSelect>
        </div>
        <div
          className={collectionSelectStyles}
          data-testid="collection-select-field"
        >
          <CollectionSelect
            name="collection"
            label={t('savedQueries.selectNamespace.collection', 'Collection')}
          ></CollectionSelect>
        </div>
        <Checkbox
          className={checkboxStyles}
          checked={updateItemNamespace}
          onChange={(event) => {
            onUpdateNamespaceChecked(event.target.checked);
          }}
          label={t(
            'savedQueries.selectNamespace.updateWithNamespace',
            'Update this {itemType} with the newly selected namespace',
            { itemType: itemTypeLabel }
          )}
          data-testid="update-query-aggregation-checkbox"
        />
      </div>
    </FormModal>
  );
};

const mapState: MapStateToProps<
  Pick<
    SelectConnectionAndNamespaceModal,
    | 'openedModal'
    | 'namespace'
    | 'itemName'
    | 'itemType'
    | 'showConnectionSelect'
    | 'isSubmitDisabled'
    | 'updateItemNamespace'
  >,
  Record<string, never>,
  RootState
> = ({
  openItem: {
    openedModal,
    selectedConnection,
    selectedDatabase,
    selectedCollection,
    selectedItem: item,
    updateItemNamespace,
    connections,
  },
}) => {
  return {
    openedModal,
    namespace: `${item?.database ?? ''}.${item?.collection ?? ''}`,
    itemName: item?.name ?? '',
    itemType: item?.type ?? '',
    showConnectionSelect: connections.length > 1,
    isSubmitDisabled: !(
      selectedConnection &&
      selectedDatabase &&
      selectedCollection
    ),
    updateItemNamespace,
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<
    SelectConnectionAndNamespaceModal,
    'onSubmit' | 'onClose' | 'onUpdateNamespaceChecked'
  >,
  Record<string, never>
> = {
  onSubmit: openSelectedItem,
  onClose: closeModal,
  onUpdateNamespaceChecked: updateItemNamespaceChecked,
};

export default connect(
  mapState,
  mapDispatch
)(SelectConnectionAndNamespaceModal);
