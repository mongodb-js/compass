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
import { VIEW_PIPELINE_UTILS } from '@mongodb-js/mongodb-constants';
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
import type { SearchIndex } from 'mongodb-data-service';
import type { CollectionStats } from '../../modules/collection-stats';
import type { Document } from 'mongodb';

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

const ViewVersionIncompatibleEmptyState = ({
  serverVersion,
  enableAtlasSearchIndexes,
}: {
  serverVersion: string;
  enableAtlasSearchIndexes: boolean;
}) => {
  if (
    VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
      serverVersion
    ) &&
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
          href="https://www.mongodb.com/docs/manual/core/views/"
          target="_blank"
        >
          Learn more about views
        </Link>
      }
    />
  );
};

const ViewNotSearchCompatibleBanner = ({
  searchIndexes,
  enableAtlasSearchIndexes,
}: {
  searchIndexes: SearchIndex[];
  enableAtlasSearchIndexes: boolean;
}) => {
  const hasNoSearchIndexes = searchIndexes.length === 0;
  const variant =
    hasNoSearchIndexes || !enableAtlasSearchIndexes ? 'warning' : 'danger';
  return (
    <Banner variant={variant} data-testid="view-not-search-compatible-banner">
      {!enableAtlasSearchIndexes && (
        <>
          <b>Looking for search indexes?</b> <br />
        </>
      )}
      This view is incompatible with search indexes. Only views containing
      $match stages with the $expr operator, $addFields, or $set are compatible
      with search indexes.{' '}
      {!hasNoSearchIndexes && 'Edit the view to rebuild search indexes.'}{' '}
      <Link
        href={'https://www.mongodb.com/docs/atlas/atlas-search/view-support/'}
        hideExternalIcon
      >
        Learn more.
      </Link>
    </Banner>
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
  serverVersion: string;
  collectionStats: CollectionStats;
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
  collectionStats,
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

  const enableAtlasSearchIndexes = usePreference('enableAtlasSearchIndexes');
  const { atlasMetadata } = useConnectionInfo();
  const isViewPipelineSearchQueryable =
    isReadonlyView && collectionStats?.pipeline
      ? VIEW_PIPELINE_UTILS.isPipelineSearchQueryable(
          collectionStats.pipeline as Document[]
        )
      : true;

  const getBanner = () => {
    if (isReadonlyView) {
      if (
        !VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
          serverVersion
        )
      ) {
        return (
          <ViewVersionIncompatibleBanner
            serverVersion={serverVersion}
            enableAtlasSearchIndexes={enableAtlasSearchIndexes}
            atlasMetadata={atlasMetadata}
          />
        );
      }
      if (!isViewPipelineSearchQueryable) {
        return (
          <ViewNotSearchCompatibleBanner
            searchIndexes={searchIndexes.indexes}
            enableAtlasSearchIndexes={enableAtlasSearchIndexes}
          />
        );
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
          {!isReadonlyView && currentIndexesView === 'regular-indexes' && (
            <RegularIndexesTable />
          )}
          {(!isReadonlyView ||
            (VIEW_PIPELINE_UTILS.isVersionSearchCompatibleForViewsCompass(
              serverVersion
            ) &&
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
  serverVersion,
  collectionStats,
}: RootState) => ({
  namespace,
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  currentIndexesView: indexView,
  serverVersion,
  collectionStats,
});

const mapDispatch = {
  refreshRegularIndexes,
  refreshSearchIndexes,
};

export default connect(mapState, mapDispatch)(Indexes);
