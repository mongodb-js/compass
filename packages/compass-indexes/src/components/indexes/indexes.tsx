import React from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Link,
  WorkspaceContainer,
  css,
  spacing,
  usePersistedState,
  EmptyContent,
} from '@mongodb-js/compass-components';

import IndexesToolbar from '../indexes-toolbar/indexes-toolbar';
import RegularIndexesTable from '../regular-indexes-table/regular-indexes-table';
import SearchIndexesTable from '../search-indexes-table/search-indexes-table';
import { refreshRegularIndexes } from '../../modules/regular-indexes';
import { refreshSearchIndexes } from '../../modules/search-indexes';
import type { State as RegularIndexesState } from '../../modules/regular-indexes';
import type { State as SearchIndexesState } from '../../modules/search-indexes';
import { FetchStatuses } from '../../utils/fetch-status';
import type { FetchStatus } from '../../utils/fetch-status';
import type { RootState } from '../../modules';
import {
  CreateSearchIndexModal,
  UpdateSearchIndexModal,
} from '../search-indexes-modals';
import type { IndexView } from '../../modules/index-view';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { getAtlasSearchIndexesLink } from '../../utils/atlas-search-indexes-link';
import CreateIndexModal from '../create-index-modal/create-index-modal';
import { ZeroGraphic } from '../search-indexes-table/zero-graphic';
import { ViewVersionIncompatibleBanner } from '../view-version-incompatible-banners/view-version-incompatible-banners';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';

// This constant is used as a trigger to show an insight whenever number of
// indexes in a collection is more than what is specified here.
const IDEAL_NUMBER_OF_MAX_INDEXES = 10;

const containerStyles = css({
  gap: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  flexGrow: 1,
});

const linkTitle = 'Search and Vector Search.';

const DISMISSED_SEARCH_INDEXES_BANNER_LOCAL_STORAGE_KEY =
  'mongodb_compass_dismissedSearchIndexesBanner' as const;

const DataExplorerViewEmptyState = () => {
  return (
    <EmptyContent
      icon={ZeroGraphic}
      title="No standard indexes"
      subTitle="Standard views use the indexes of the underlying collection. As a result, you
           cannot create, drop or re-build indexes on a standard view directly, nor get a list of indexes on the view."
      callToActionLink={
        <Link
          href="https://www.mongodb.com/docs/atlas/atlas-search/" // PLACEHOLDER LINK
          target="_blank"
        >
          Learn more about views
        </Link>
      }
    />
  );
};

const AtlasIndexesBanner = ({
  namespace,
  dismissed,
  onDismissClick,
  atlasMetadata,
  isReadonlyView,
}: {
  namespace: string;
  dismissed: boolean;
  onDismissClick: () => void;
  atlasMetadata: AtlasClusterMetadata | undefined;
  isReadonlyView?: boolean;
}) => {
  if (!atlasMetadata || dismissed) {
    return null;
  }

  const viewIsSearchCompatible = false; // view only contains $addFields, $set or $match stages with the $expr operator.
  const bannerVariant =
    isReadonlyView && !viewIsSearchCompatible ? 'warning' : 'info';
  const bannerText =
    isReadonlyView && !viewIsSearchCompatible
      ? 'This view is incompatible with search indexes. To use search indexes, edit the view to only contain $addFields, $set or $match stages with the $expr operator. You can view all search indexes under '
      : 'These indexes can be created and viewed under ';
  return (
    <Banner variant={bannerVariant} dismissible onClose={onDismissClick}>
      <b>Looking for search indexes?</b>
      <br />
      {bannerText}
      {atlasMetadata ? (
        <Link
          href={getAtlasSearchIndexesLink({
            clusterName: atlasMetadata.clusterName,
            namespace,
          })}
          hideExternalIcon
        >
          {linkTitle}
        </Link>
      ) : (
        linkTitle
      )}
    </Banner>
  );
};

/*  if (version > 8.0 || version===8.0 && !isSearchManagementActive) { // compass >8.0 and data explorer >=8.0
    return ( // ALSO CHECK IF VIEW IS SEARCH QUERYABLE
        <Banner variant={BannerVariant.Warning}>
          <b>Looking for search indexes?</b>
          <br />
          This view is incompatible with search indexes. To use search indexes,
          edit the view to only contain $addFields, $set, or $match stages with
          the $expr operator. You can view all search indexes under INSERT LINK.
        </Banner>
    );
  }*/

type IndexesProps = {
  namespace: string;
  isReadonlyView?: boolean;
  regularIndexes: Pick<RegularIndexesState, 'indexes' | 'error' | 'status'>;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  currentIndexesView: IndexView;
  refreshRegularIndexes: () => void;
  refreshSearchIndexes: () => void;
  serverVersion: string;
};

function isRefreshingStatus(status: FetchStatus) {
  return (
    status === FetchStatuses.FETCHING || status === FetchStatuses.REFRESHING
  );
}

const indexesContainersStyles = css({
  padding: spacing[400],
  // No padding bottom so that the table can scroll visibly to the bottom.
  paddingBottom: 0,
  display: 'grid',
  gridTemplateColumns: '100%',
  gap: spacing[200],
});

export function Indexes({
  namespace,
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  currentIndexesView,
  refreshRegularIndexes,
  refreshSearchIndexes,
  serverVersion,
}: IndexesProps) {
  const [atlasBannerDismissed, setDismissed] = usePersistedState(
    DISMISSED_SEARCH_INDEXES_BANNER_LOCAL_STORAGE_KEY,
    false
  );

  const errorMessage =
    currentIndexesView === 'regular-indexes'
      ? regularIndexes.error
      : searchIndexes.error;

  const hasTooManyIndexes =
    currentIndexesView === 'regular-indexes' &&
    regularIndexes.indexes.length > IDEAL_NUMBER_OF_MAX_INDEXES;

  const isRefreshing =
    currentIndexesView === 'regular-indexes'
      ? isRefreshingStatus(regularIndexes.status)
      : isRefreshingStatus(searchIndexes.status);

  const onRefreshIndexes =
    currentIndexesView === 'regular-indexes'
      ? refreshRegularIndexes
      : refreshSearchIndexes;

  const enableAtlasSearchIndexes = usePreference('enableAtlasSearchIndexes');
  const mongoDBMajorVersion = serverVersion.split('.').slice(0, 2).join('.');
  const { atlasMetadata } = useConnectionInfo();
  return (
    <div className={containerStyles}>
      <WorkspaceContainer
        toolbar={
          <IndexesToolbar
            errorMessage={errorMessage || null}
            hasTooManyIndexes={hasTooManyIndexes}
            isRefreshing={isRefreshing}
            onRefreshIndexes={onRefreshIndexes}
            showAtlasSearchLink={
              !isReadonlyView &&
              !enableAtlasSearchIndexes &&
              atlasBannerDismissed
            }
          />
        }
      >
        <div className={indexesContainersStyles}>
          {isReadonlyView && (
            <ViewVersionIncompatibleBanner
              namespace={namespace}
              serverVersion={serverVersion}
              mongoDBMajorVersion={mongoDBMajorVersion}
              enableAtlasSearchIndexes={enableAtlasSearchIndexes}
              atlasMetadata={atlasMetadata}
            />
          )}
          {!enableAtlasSearchIndexes && (
            <AtlasIndexesBanner
              namespace={namespace}
              dismissed={atlasBannerDismissed}
              onDismissClick={() => {
                setDismissed(true);
              }}
              atlasMetadata={atlasMetadata}
              isReadonlyView={isReadonlyView}
            />
          )}
          {!isReadonlyView && currentIndexesView === 'regular-indexes' && (
            <RegularIndexesTable />
          )}
          {!isReadonlyView && currentIndexesView === 'search-indexes' && (
            <SearchIndexesTable />
          )}
          {isReadonlyView &&
            !enableAtlasSearchIndexes &&
            searchIndexes.indexes.length === 0 && (
              <DataExplorerViewEmptyState />
            )}
        </div>
      </WorkspaceContainer>
      <CreateSearchIndexModal />
      <UpdateSearchIndexModal />
      <CreateIndexModal query={null} />
    </div>
  );
}

const mapState = ({
  namespace,
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  indexView,
  serverVersion,
}: RootState) => ({
  namespace,
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  currentIndexesView: indexView,
  serverVersion,
});

const mapDispatch = {
  refreshRegularIndexes,
  refreshSearchIndexes,
};

export default connect(mapState, mapDispatch)(Indexes);
