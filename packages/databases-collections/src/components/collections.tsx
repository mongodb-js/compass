import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { CollectionsList } from '@mongodb-js/databases-collections-list';
import {
  Banner,
  BannerVariant,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useTrackOnChange } from '@mongodb-js/compass-logging/provider';
import {
  refreshCollections,
  type CollectionsState,
  openCollection,
  deleteCollection,
  createNewCollection,
} from '../modules/collections';
import type Collection from 'mongodb-collection-model';
import toNS from 'mongodb-ns';

const ERROR_WARNING = 'An error occurred while loading collections';

const collectionsErrorStyles = css({
  padding: spacing[3],
});

type CollectionsListProps = {
  namespace: string;
  collections: Collection[];
  collectionsLoadingStatus: string;
  collectionsLoadingError?: string | null;
  isEditable: boolean;
  onCollectionClick(ns: string): void;
  onDeleteCollectionClick(ns: string): void;
  onCreateCollectionClick(dbName: string): void;
  onRefreshClick(): void;
};

const Collections: React.FunctionComponent<CollectionsListProps> = ({
  namespace,
  collections,
  collectionsLoadingStatus,
  collectionsLoadingError,
  isEditable,
  onCollectionClick,
  onDeleteCollectionClick,
  onCreateCollectionClick: _onCreateCollectionClick,
  onRefreshClick,
}) => {
  useTrackOnChange(
    'COMPASS-COLLECTIONS-UI',
    (track) => {
      track('Screen', { name: 'collections' });
    },
    []
  );

  const onCreateCollectionClick = useCallback(() => {
    _onCreateCollectionClick(toNS(namespace).database);
  }, [namespace, _onCreateCollectionClick]);

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
    { onCollectionClick, onRefreshClick },
    isEditable ? { onDeleteCollectionClick, onCreateCollectionClick } : {}
  );

  return <CollectionsList collections={collections} {...actions} />;
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
    onCollectionClick: openCollection,
    onDeleteCollectionClick: deleteCollection,
    onCreateCollectionClick: createNewCollection,
  }
)(Collections);

export default ConnectedCollections;
export { Collections };
