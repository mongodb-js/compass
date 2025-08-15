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
  Body,
} from '@mongodb-js/compass-components';

import IndexesToolbar from '../indexes-toolbar/indexes-toolbar';
import RegularIndexesTable from '../regular-indexes-table/regular-indexes-table';
import SearchIndexesTable from '../search-indexes-table/search-indexes-table';
import { refreshRegularIndexes } from '../../modules/regular-indexes';
import {
  isVersionSearchCompatibleForViews,
  refreshSearchIndexes,
} from '../../modules/search-indexes';
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
import semver from 'semver';

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

export const MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_DE = '8.0.0';
export const isVersionSearchCompatibleForViewsDataExplorer = (
  serverVersion: string
) => {
  try {
    return semver.gte(
      serverVersion,
      MIN_VERSION_FOR_VIEW_SEARCH_COMPATIBILITY_DE
    );
  } catch {
    return false;
  }
};

const ViewVersionIncompatibleEmptyState = ({
  serverVersion,
  enableAtlasSearchIndexes,
}: {
  serverVersion: string;
  enableAtlasSearchIndexes: boolean;
}) => {
  if (
    isVersionSearchCompatibleForViews(serverVersion) &&
    enableAtlasSearchIndexes
  ) {
    return null;
  }
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
}: {
  namespace: string;
  dismissed: boolean;
  onDismissClick: () => void;
}) => {
  const { atlasMetadata } = useConnectionInfo();

  if (!atlasMetadata || dismissed) {
    return null;
  }

  return (
    <Banner variant="info" dismissible onClose={onDismissClick}>
      <Body weight="medium">Looking for search indexes?</Body>
      These indexes can be created and viewed under{' '}
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
              serverVersion={serverVersion}
              enableAtlasSearchIndexes={enableAtlasSearchIndexes}
              atlasMetadata={atlasMetadata}
            />
          )}
          {(!isReadonlyView ||
            (isVersionSearchCompatibleForViewsDataExplorer(serverVersion) &&
              !enableAtlasSearchIndexes)) && (
            <AtlasIndexesBanner // cta to Atlas Search Indexes Page
              namespace={namespace}
              dismissed={atlasBannerDismissed}
              onDismissClick={() => {
                setDismissed(true);
              }}
            />
          )}
          {!isReadonlyView && currentIndexesView === 'regular-indexes' && (
            <RegularIndexesTable />
          )}
          {(!isReadonlyView ||
            (isVersionSearchCompatibleForViews(serverVersion) &&
              enableAtlasSearchIndexes)) &&
            currentIndexesView === 'search-indexes' && <SearchIndexesTable />}
          {isReadonlyView && searchIndexes.indexes.length === 0 && (
            <ViewVersionIncompatibleEmptyState
              serverVersion={serverVersion}
              enableAtlasSearchIndexes={enableAtlasSearchIndexes}
            />
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
