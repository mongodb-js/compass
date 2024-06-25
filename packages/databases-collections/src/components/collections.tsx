import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import { CollectionsList } from '@mongodb-js/databases-collections-list';
import {
  Banner,
  BannerVariant,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import {
  refreshCollections,
  type CollectionsState,
  deleteCollection,
  createNewCollection,
} from '../modules/collections';
import type Collection from 'mongodb-collection-model';
import toNS from 'mongodb-ns';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionScopedTrackOnChange } from '@mongodb-js/compass-connections/provider';

const ERROR_WARNING = 'An error occurred while loading collections';

const collectionsErrorStyles = css({
  padding: spacing[3],
});

type CollectionsListProps = {
  namespace: string;
  collections: ReturnType<Collection['toJSON']>[];
  collectionsLoadingStatus: string;
  collectionsLoadingError?: string | null;
  isEditable: boolean;
  onDeleteCollectionClick(connectionId: string, ns: string): void;
  onCreateCollectionClick(connectionId: string, dbName: string): void;
  onRefreshClick(): void;
};

const Collections: React.FunctionComponent<CollectionsListProps> = ({
  namespace,
  collections,
  collectionsLoadingStatus,
  collectionsLoadingError,
  isEditable: isInstanceWritable,
  onDeleteCollectionClick: _onDeleteCollectionClick,
  onCreateCollectionClick: _onCreateCollectionClick,
  onRefreshClick,
}) => {
  const isCompassInWritableMode = !usePreference('readOnly');
  const isEditable = useMemo(() => {
    return isCompassInWritableMode && isInstanceWritable;
  }, [isCompassInWritableMode, isInstanceWritable]);
  const connectionInfo = useConnectionInfo();
  const { id: connectionId } = connectionInfo;
  const { openDatabasesWorkspace, openCollectionWorkspace } =
    useOpenWorkspace();

  const parsedNS = toNS(namespace);

  useConnectionScopedTrackOnChange((track) => {
    track('Screen', { name: 'collections', connectionId });
  }, []);

  const onCollectionClick = useCallback(
    (ns: string) => {
      openCollectionWorkspace(connectionId, ns);
    },
    [connectionId, openCollectionWorkspace]
  );

  const onCreateCollectionClick = useCallback(() => {
    _onCreateCollectionClick(connectionId, toNS(namespace).database);
  }, [connectionId, namespace, _onCreateCollectionClick]);

  const onDeleteCollectionClick = useCallback(
    (ns: string) => {
      _onDeleteCollectionClick(connectionId, ns);
    },
    [connectionId, _onDeleteCollectionClick]
  );

  const onClickConnectionBreadcrumb = useCallback(() => {
    openDatabasesWorkspace(connectionId);
  }, [connectionId, openDatabasesWorkspace]);

  if (collectionsLoadingStatus === 'error') {
    return (
      <div className={collectionsErrorStyles}>
        <Banner variant={BannerVariant.Danger}>
          {collectionsLoadingError
            ? `${ERROR_WARNING}: ${collectionsLoadingError}`
            : ERROR_WARNING}
        </Banner>
      </div>
    );
  }

  const actions = Object.assign(
    {
      onCollectionClick,
      onRefreshClick,
    },
    isEditable
      ? {
          onCreateCollectionClick,
          onDeleteCollectionClick,
        }
      : {}
  );

  return (
    <CollectionsList
      collections={collections}
      databaseName={parsedNS.database}
      connectionTitle={getConnectionTitle(connectionInfo)}
      onClickConnectionBreadcrumb={onClickConnectionBreadcrumb}
      {...actions}
    />
  );
};

const ConnectedCollections = connect(
  (state: CollectionsState, { namespace }: { namespace: string }) => {
    const isEditable = state.instance.isWritable && !state.instance.isDataLake;
    return {
      namespace,
      collections: state.collections,
      collectionsLoadingStatus: state.collectionsLoadingStatus.status,
      collectionsLoadingError: state.collectionsLoadingStatus.error,
      isEditable,
    };
  },
  {
    onRefreshClick: refreshCollections,
    onDeleteCollectionClick: deleteCollection,
    onCreateCollectionClick: createNewCollection,
  }
)(Collections);

export default ConnectedCollections;
export { Collections };
