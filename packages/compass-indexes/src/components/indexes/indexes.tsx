import React from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  Link,
  WorkspaceContainer,
  css,
  spacing,
  usePersistedState,
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

// This constant is used as a trigger to show an insight whenever number of
// indexes in a collection is more than what is specified here.
const IDEAL_NUMBER_OF_MAX_INDEXES = 10;

const containerStyles = css({
  paddingTop: spacing[400],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  // No padding bottom so that the table can scroll visibly to the bottom
  paddingBottom: 0,
  gap: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  flexGrow: 1,
});

const linkTitle = 'Atlas Search.';

const DISMISSED_SEARCH_INDEXES_BANNER_LOCAL_STORAGE_KEY =
  'mongodb_compass_dismissedSearchIndexesBanner' as const;

const AtlasIndexesBanner = ({ namespace }: { namespace: string }) => {
  const { atlasMetadata } = useConnectionInfo();
  const [dismissed, setDismissed] = usePersistedState(
    DISMISSED_SEARCH_INDEXES_BANNER_LOCAL_STORAGE_KEY,
    false
  );

  if (!atlasMetadata || dismissed) {
    return null;
  }

  return (
    <Banner variant="info" dismissible onClose={() => setDismissed(true)}>
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
};

function isRefreshingStatus(status: FetchStatus) {
  return (
    status === FetchStatuses.FETCHING || status === FetchStatuses.REFRESHING
  );
}

const indexesContainersStyles = css({
  paddingTop: spacing[400],
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
}: IndexesProps) {
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

  return (
    <div className={containerStyles}>
      <WorkspaceContainer
        toolbar={
          <IndexesToolbar
            errorMessage={errorMessage || null}
            hasTooManyIndexes={hasTooManyIndexes}
            isRefreshing={isRefreshing}
            onRefreshIndexes={onRefreshIndexes}
          />
        }
      >
        <div className={indexesContainersStyles}>
          {!isReadonlyView && !enableAtlasSearchIndexes && (
            <AtlasIndexesBanner namespace={namespace} />
          )}
          {!isReadonlyView && currentIndexesView === 'regular-indexes' && (
            <RegularIndexesTable />
          )}
          {!isReadonlyView && currentIndexesView === 'search-indexes' && (
            <SearchIndexesTable />
          )}
        </div>
      </WorkspaceContainer>
      <CreateSearchIndexModal />
      <UpdateSearchIndexModal />
      <CreateIndexModal />
    </div>
  );
}

const mapState = ({
  namespace,
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  indexView,
}: RootState) => ({
  namespace,
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  currentIndexesView: indexView,
});

const mapDispatch = {
  refreshRegularIndexes,
  refreshSearchIndexes,
};

export default connect(mapState, mapDispatch)(Indexes);
