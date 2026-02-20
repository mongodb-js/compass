import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import type { RootState } from '../../../modules';
import type { State as RegularIndexesState } from '../../../modules/regular-indexes';
import type { State as SearchIndexesState } from '../../../modules/search-indexes';
import {
  openCreateSearchIndexDrawerView,
  refreshAllIndexes,
  startPollingAllIndexes,
  stopPollingAllIndexes,
} from '../../../modules/indexes-drawer';
import type { SearchIndexType } from '../../../modules/indexes-drawer';
import {
  Accordion,
  Button,
  css,
  DropdownMenuButton,
  EmptyContent,
  Icon,
  Link,
  SearchInput,
  spacing,
  SpinLoader,
} from '@mongodb-js/compass-components';
import { createIndexOpened } from '../../../modules/create-index';
import { FetchStatuses } from '../../../utils/fetch-status';
import type { FetchStatus } from '../../../utils/fetch-status';
import ViewVersionIncompatibleBanner from '../../view-incompatible-components/view-version-incompatible-banner';
import ViewPipelineIncompatibleBanner from '../../view-incompatible-components/view-pipeline-incompatible-banner';
import ViewStandardIndexesIncompatibleEmptyState from '../../view-incompatible-components/view-standard-indexes-incompatible-empty-state';
import { ZeroSearchIndexesGraphic } from '../../icons/zero-search-indexes-graphic';
import { selectIsViewSearchCompatible } from '../../../utils/is-view-search-compatible';
import { selectReadWriteAccess } from '../../../utils/indexes-read-write-access';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { usePreferences } from 'compass-preferences-model/provider';
import RegularIndexesTable from '../../regular-indexes-table/regular-indexes-table';
import SearchIndexesTable from '../../search-indexes-table/search-indexes-table';
import { ZeroRegularIndexesGraphic } from '../../icons/zero-regular-indexes-graphic';

const containerStyles = css({
  padding: spacing[400],
  gap: spacing[400],
  display: 'flex',
  flexDirection: 'column',
});

const buttonContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const emptyContentStyles = css({
  marginTop: 0,
});

const spinnerStyles = css({ marginRight: spacing[200] });

type NoStandardIndexesEmptyContentProps = {
  isRegularIndexesWritable: boolean;
  onCreateRegularIndexClick: () => void;
};

const NoStandardIndexesEmptyContent: React.FunctionComponent<
  NoStandardIndexesEmptyContentProps
> = ({ isRegularIndexesWritable, onCreateRegularIndexClick }) => {
  return (
    <EmptyContent
      containerClassName={emptyContentStyles}
      icon={ZeroRegularIndexesGraphic}
      title="No standard indexes found"
      callToActionLink={
        <Button
          disabled={!isRegularIndexesWritable}
          onClick={onCreateRegularIndexClick}
          size="xsmall"
        >
          Create index
        </Button>
      }
      subTitle={
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

type NoSearchIndexesEmptyContentProps = {
  isSearchIndexesWritable: boolean;
  onActionDispatch: (action: string) => void;
};

const NoSearchIndexesEmptyContent: React.FunctionComponent<
  NoSearchIndexesEmptyContentProps
> = ({ isSearchIndexesWritable, onActionDispatch }) => {
  return (
    <EmptyContent
      containerClassName={emptyContentStyles}
      icon={ZeroSearchIndexesGraphic}
      title="No search indexes found"
      subTitle={
        <span>
          Define a{' '}
          <Link
            // TODO(COMPASS-10427): add url
            target="_blank"
          >
            search
          </Link>{' '}
          or{' '}
          <Link
            // TODO(COMPASS-10427): add url
            target="_blank"
          >
            vector search index
          </Link>{' '}
          to start using $search or $vectorSearch.
        </span>
      }
      callToActionLink={
        <DropdownMenuButton
          buttonText="Create a search index"
          buttonProps={{
            size: 'xsmall',
            disabled: !isSearchIndexesWritable,
          }}
          actions={[
            {
              action: 'createSearchIndex',
              label: 'Search Index',
            },
            {
              action: 'createVectorSearchIndex',
              label: 'Vector Search Index',
            },
          ]}
          onAction={onActionDispatch}
        />
      }
    />
  );
};

type IndexesListDrawerViewProps = {
  isReadonlyView: boolean;
  regularIndexes: Pick<RegularIndexesState, 'indexes' | 'error' | 'status'>;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  onRefreshClick: () => void;
  onCreateRegularIndexClick: () => void;
  onCreateSearchIndexClick: (currentIndexType: SearchIndexType) => void;
  startPolling: () => void;
  stopPolling: () => void;
};

function isRefreshingStatus(status: FetchStatus) {
  return (
    status === FetchStatuses.FETCHING || status === FetchStatuses.REFRESHING
  );
}

const IndexesListDrawerView: React.FunctionComponent<
  IndexesListDrawerViewProps
> = ({
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  onRefreshClick,
  onCreateRegularIndexClick,
  onCreateSearchIndexClick,
  startPolling,
  stopPolling,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { atlasMetadata } = useConnectionInfo();
  const isAtlas = !!atlasMetadata;
  const { readOnly, readWrite, enableAtlasSearchIndexes } = usePreferences([
    'readOnly',
    'readWrite',
    'enableAtlasSearchIndexes',
  ]);
  const { isViewVersionSearchCompatible, isViewPipelineSearchQueryable } =
    useSelector(selectIsViewSearchCompatible(isAtlas));
  const {
    isRegularIndexesReadable,
    isRegularIndexesWritable,
    isSearchIndexesReadable,
    isSearchIndexesWritable,
  } = useSelector(
    selectReadWriteAccess({
      isAtlas,
      readOnly,
      readWrite,
      enableAtlasSearchIndexes,
    })
  );

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling]);

  const onActionDispatch = useCallback(
    (action: string) => {
      switch (action) {
        case 'createRegularIndex':
          return onCreateRegularIndexClick();
        case 'createSearchIndex':
          return onCreateSearchIndexClick('search');
        case 'createVectorSearchIndex':
          return onCreateSearchIndexClick('vectorSearch');
      }
    },
    [onCreateRegularIndexClick, onCreateSearchIndexClick]
  );

  const getSearchIndexesBanner = () => {
    if (isReadonlyView) {
      if (!isViewVersionSearchCompatible) {
        return <ViewVersionIncompatibleBanner />;
      }
      if (!isViewPipelineSearchQueryable) {
        return <ViewPipelineIncompatibleBanner />;
      }
    }

    return null;
  };

  const isRefreshing =
    (isRegularIndexesReadable && isRefreshingStatus(regularIndexes.status)) ||
    (isSearchIndexesReadable && isRefreshingStatus(searchIndexes.status));

  const filteredRegularIndexes = useMemo(() => {
    if (!searchTerm) {
      return regularIndexes.indexes;
    }
    return regularIndexes.indexes.filter((x) => x.name.includes(searchTerm));
  }, [regularIndexes, searchTerm]);

  const filteredSearchIndexes = useMemo(() => {
    if (!searchTerm) {
      return searchIndexes.indexes;
    }
    return searchIndexes.indexes.filter((x) => x.name.includes(searchTerm));
  }, [searchIndexes, searchTerm]);

  const refreshButtonIcon = isRefreshing ? (
    <div className={spinnerStyles}>
      <SpinLoader title="Refreshing Indexes" />
    </div>
  ) : (
    <Icon glyph="Refresh" title="Refresh Indexes" />
  );

  return (
    <div className={containerStyles}>
      <div className={buttonContainerStyles}>
        <Button
          disabled={
            isRefreshing ||
            (!isRegularIndexesReadable && !isSearchIndexesReadable)
          }
          onClick={onRefreshClick}
          variant="default"
          size="xsmall"
          leftGlyph={refreshButtonIcon}
        >
          Refresh
        </Button>
        <DropdownMenuButton
          buttonText="Create new"
          buttonProps={{
            size: 'xsmall',
            variant: 'primary',
          }}
          actions={[
            {
              action: 'createRegularIndex',
              label: 'Standard Index',
              isDisabled: !isRegularIndexesWritable,
            },
            {
              action: 'createSearchIndex',
              label: 'Search Index',
              isDisabled: !isSearchIndexesWritable,
            },
            {
              action: 'createVectorSearchIndex',
              label: 'Vector Search Index',
              isDisabled: !isSearchIndexesWritable,
            },
          ]}
          onAction={onActionDispatch}
        />
      </div>
      <SearchInput
        aria-label="Indexes search"
        placeholder="Find by index name"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Accordion text="Standard" defaultOpen={true}>
        {isRegularIndexesReadable ? (
          filteredRegularIndexes.length > 0 ? (
            <RegularIndexesTable
              indexes={filteredRegularIndexes}
              context="indexes-drawer"
            />
          ) : (
            <NoStandardIndexesEmptyContent
              isRegularIndexesWritable={isRegularIndexesWritable}
              onCreateRegularIndexClick={onCreateRegularIndexClick}
            />
          )
        ) : (
          <ViewStandardIndexesIncompatibleEmptyState
            containerClassName={emptyContentStyles}
          />
        )}
      </Accordion>
      <Accordion text="Search" defaultOpen={true}>
        {getSearchIndexesBanner()}
        {filteredSearchIndexes.length > 0 ? (
          <SearchIndexesTable
            indexes={filteredSearchIndexes}
            context="indexes-drawer"
          />
        ) : (
          <NoSearchIndexesEmptyContent
            isSearchIndexesWritable={isSearchIndexesWritable}
            onActionDispatch={onActionDispatch}
          />
        )}
      </Accordion>
    </div>
  );
};

const mapState = ({
  isReadonlyView,
  regularIndexes,
  searchIndexes,
}: RootState) => ({
  isReadonlyView,
  regularIndexes,
  searchIndexes,
});

const mapDispatch = {
  onRefreshClick: refreshAllIndexes,
  onCreateRegularIndexClick: createIndexOpened,
  onCreateSearchIndexClick: openCreateSearchIndexDrawerView,
  startPolling: startPollingAllIndexes,
  stopPolling: stopPollingAllIndexes,
};

export default connect(mapState, mapDispatch)(IndexesListDrawerView);
