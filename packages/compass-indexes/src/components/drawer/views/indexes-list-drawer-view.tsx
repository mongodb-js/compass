import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
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
  Icon,
  SearchInput,
  spacing,
  SpinLoader,
  useDrawerActions,
} from '@mongodb-js/compass-components';
import { createIndexOpened } from '../../../modules/create-index';
import { FetchStatuses } from '../../../utils/fetch-status';
import type { FetchStatus } from '../../../utils/fetch-status';
import { INDEXES_DRAWER_ID } from '../../../plugin-drawer';

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

const spinnerStyles = css({ marginRight: spacing[200] });

type IndexesListDrawerViewProps = {
  isRegularIndexesEnabled: boolean;
  isSearchIndexesEnabled: boolean;
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
  isRegularIndexesEnabled,
  isSearchIndexesEnabled,
  regularIndexes,
  searchIndexes,
  onRefreshClick,
  onCreateRegularIndexClick,
  onCreateSearchIndexClick,
  startPolling,
  stopPolling,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { openDrawer } = useDrawerActions();

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
          onCreateSearchIndexClick('search');
          openDrawer(INDEXES_DRAWER_ID);
          return;
        case 'createVectorSearchIndex':
          onCreateSearchIndexClick('vectorSearch');
          openDrawer(INDEXES_DRAWER_ID);
          return;
      }
    },
    [onCreateRegularIndexClick, onCreateSearchIndexClick, openDrawer]
  );

  const isRefreshing =
    (isRegularIndexesEnabled && isRefreshingStatus(regularIndexes.status)) ||
    (isSearchIndexesEnabled && isRefreshingStatus(searchIndexes.status));

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
            (!isRegularIndexesEnabled && !isSearchIndexesEnabled)
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
              isDisabled: !isRegularIndexesEnabled,
            },
            {
              action: 'createSearchIndex',
              label: 'Search Index',
              isDisabled: !isSearchIndexesEnabled,
            },
            {
              action: 'createVectorSearchIndex',
              label: 'Vector Search Index',
              isDisabled: !isSearchIndexesEnabled,
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
        {isRegularIndexesEnabled ? (
          filteredRegularIndexes.map((index) => (
            <div key={index.name}>{index.name}</div>
          ))
        ) : (
          <div>Standard indexes not enabled</div>
        )}
      </Accordion>
      <Accordion text="Search" defaultOpen={true}>
        {isSearchIndexesEnabled ? (
          filteredSearchIndexes.map((index) => (
            <div key={index.name}>{index.name}</div>
          ))
        ) : (
          <div>Search indexes not enabled</div>
        )}
      </Accordion>
    </div>
  );
};

const mapState = ({
  isSearchIndexesSupported,
  isReadonlyView,
  regularIndexes,
  searchIndexes,
}: RootState) => ({
  // TODO: determine correct conditions for when to show regular indexes section and search indexes section
  // based on user preferences, server version, view or collection, compass vs DE etc
  isRegularIndexesEnabled: !isReadonlyView,
  isSearchIndexesEnabled: isReadonlyView || isSearchIndexesSupported,
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
