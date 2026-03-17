import React from 'react';
import { connect, useSelector } from 'react-redux';
import {
  Banner,
  Link,
  WorkspaceContainer,
  css,
  spacing,
  usePersistedState,
  Body,
  AtlasSkillsBanner,
} from '@mongodb-js/compass-components';
import {
  useTelemetry,
  SkillsBannerContextEnum,
  useAtlasSkillsBanner,
} from '@mongodb-js/compass-telemetry/provider';
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
import { usePreferences } from 'compass-preferences-model/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { getAtlasSearchIndexesLink } from '../../utils/atlas-search-indexes-link';
import CreateIndexModal from '../create-index-modal/create-index-modal';
import ViewVersionIncompatibleBanner from '../view-incompatible-components/view-version-incompatible-banner';
import ViewSearchIncompatibleBanner from '../view-incompatible-components/view-pipeline-incompatible-banner';
import ViewStandardIndexesIncompatibleEmptyState from '../view-incompatible-components/view-standard-indexes-incompatible-empty-state';
import { selectIsViewSearchCompatible } from '../../utils/is-view-search-compatible';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';

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
  const track = useTelemetry();

  if (!atlasMetadata || dismissed) {
    return null;
  }

  return (
    <Banner variant="info" dismissible onClose={onDismissClick}>
      <Body weight="medium">Looking for search indexes?</Body>
      These indexes can be created and viewed under{' '}
      {atlasMetadata ? (
        <Link
          target="_blank"
          rel="noopener"
          href={getAtlasSearchIndexesLink({
            clusterName: atlasMetadata.clusterName,
            namespace,
          })}
          onClick={() => {
            track('Atlas Search Indexes for View Link Clicked', {
              context: 'Indexes Tab',
            });
          }}
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
}: IndexesProps) {
  const track = useTelemetry();
  const [atlasBannerDismissed, setDismissed] = usePersistedState(
    DISMISSED_SEARCH_INDEXES_BANNER_LOCAL_STORAGE_KEY,
    false
  );

  // @experiment Skills in Atlas  | Jira Epic: CLOUDP-346311
  const [atlasSkillsBanner, setSkillDismissed] = usePersistedState(
    'mongodb_compass_dismissedAtlasIndexSkillBanner',
    false
  );
  const { shouldShowAtlasSkillsBanner } = useAtlasSkillsBanner(
    SkillsBannerContextEnum.Indexes
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

  const { atlasMetadata } = useConnectionInfo();
  const isAtlas = !!atlasMetadata;
  const { readOnly, readWrite, enableAtlasSearchIndexes } = usePreferences([
    'readOnly',
    'readWrite',
    'enableAtlasSearchIndexes',
  ]);
  const { isViewVersionSearchCompatible, isViewPipelineSearchQueryable } =
    useSelector(selectIsViewSearchCompatible(isAtlas));
  const { isRegularIndexesReadable, isSearchIndexesReadable } = useSelector(
    selectReadWriteAccess({
      isAtlas,
      readOnly,
      readWrite,
      enableAtlasSearchIndexes,
    })
  );
  const getBanner = () => {
    if (isReadonlyView) {
      if (!isViewVersionSearchCompatible) {
        return <ViewVersionIncompatibleBanner />;
      }
      if (!isViewPipelineSearchQueryable) {
        return <ViewSearchIncompatibleBanner />;
      }
    }

    if (!isReadonlyView || !enableAtlasSearchIndexes) {
      return (
        <AtlasIndexesBanner
          namespace={namespace}
          dismissed={atlasBannerDismissed}
          onDismissClick={() => {
            setDismissed(true);
          }}
        />
      );
    }
    return null;
  };

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
          {getBanner()}

          <AtlasSkillsBanner
            ctaText="Learn how to design efficient indexes to speed up queries."
            skillsUrl="https://learn.mongodb.com/courses/indexing-design-fundamentals?team=growth"
            onCloseSkillsBanner={() => {
              setSkillDismissed(true);
              track('Atlas Skills CTA Dismissed', {
                context: 'Indexes Tab',
              });
            }}
            showBanner={shouldShowAtlasSkillsBanner && !atlasSkillsBanner}
            onCtaClick={() => {
              track('Atlas Skills CTA Clicked', {
                context: 'Indexes Tab',
              });
            }}
          />
          {isRegularIndexesReadable &&
            currentIndexesView === 'regular-indexes' && <RegularIndexesTable />}
          {isSearchIndexesReadable &&
            currentIndexesView === 'search-indexes' && <SearchIndexesTable />}
          {isReadonlyView && !isSearchIndexesReadable && (
            <ViewStandardIndexesIncompatibleEmptyState />
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
