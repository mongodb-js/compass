import React, { useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import {
  refreshRegularIndexes,
  startPollingRegularIndexes,
  State as RegularIndexesState,
  stopPollingRegularIndexes,
} from '../../../modules/regular-indexes';
import {
  refreshSearchIndexes,
  startPollingSearchIndexes,
  State as SearchIndexesState,
  stopPollingSearchIndexes,
} from '../../../modules/search-indexes';
import {
  Button,
  css,
  Icon,
  Menu,
  MenuItem,
  SearchInput,
  spacing,
  SpinLoader,
} from '@mongodb-js/compass-components';
import {
  openCreateSearchIndexDrawerView,
  SearchIndexType,
} from '../../../modules/indexes-drawer';
import { createIndexOpened } from '../../../modules/create-index';
import { CollectionStats } from '../../../modules/collection-stats';
import { FetchStatus, FetchStatuses } from '../../../utils/fetch-status';

const containerStyles = css({
  padding: spacing[400],
  gap: spacing[400],
  display: 'flex',
  flexDirection: 'column',
});

const buttonContainerStyles = css({
  display: 'flex',
});

const gapContainerStyles = css({
  flexGrow: 1,
});

const collapsibleSectionHeaderStyles = css({
  border: 'none',
  boxShadow: 'none',
  background: 'none',
  '&:hover': {
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
  },
});

const spinnerStyles = css({ marginRight: spacing[200] });

type IndexesListDrawerViewProps = {
  isSearchIndexesSupported: boolean;
  isReadonlyView: boolean;
  serverVersion: string;
  regularIndexes: Pick<RegularIndexesState, 'indexes' | 'error' | 'status'>;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  collectionStats: CollectionStats;
  refreshRegularIndexes: () => void;
  refreshSearchIndexes: () => void;
  createIndexOpened: () => void;
  openCreateSearchIndexDrawerView: (searchIndexType: SearchIndexType) => void;
  startPollingRegularIndexes: () => void;
  stopPollingRegularIndexes: () => void;
  startPollingSearchIndexes: () => void;
  stopPollingSearchIndexes: () => void;
};

const CollapsibleSection: React.FunctionComponent<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        leftGlyph={
          <Icon glyph={isExpanded ? 'ChevronDown' : 'ChevronRight'}></Icon>
        }
        variant="default"
        size="xsmall"
        className={collapsibleSectionHeaderStyles}
      >
        {label}
      </Button>
      {isExpanded && children}
    </div>
  );
};

function isRefreshingStatus(status: FetchStatus) {
  return (
    status === FetchStatuses.FETCHING || status === FetchStatuses.REFRESHING
  );
}

const IndexesListDrawerView: React.FunctionComponent<
  IndexesListDrawerViewProps
> = ({
  isSearchIndexesSupported,
  isReadonlyView,
  serverVersion,
  regularIndexes,
  searchIndexes,
  collectionStats,
  refreshRegularIndexes,
  refreshSearchIndexes,
  createIndexOpened,
  openCreateSearchIndexDrawerView,
  startPollingRegularIndexes,
  stopPollingRegularIndexes,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // TODO: determine correct conditions for when to show regular indexes section and search indexes section
  // based on user preferences, server version, view or collection, compass vs DE etc
  const isRegularIndexesEnabled = !isReadonlyView;
  const isSearchIndexesEnabled = isReadonlyView || isSearchIndexesSupported;

  useEffect(() => {
    if (isRegularIndexesEnabled) {
      startPollingRegularIndexes();
    }
    if (isSearchIndexesEnabled) {
      startPollingSearchIndexes();
    }
    return () => {
      stopPollingRegularIndexes();
      stopPollingSearchIndexes();
    };
  }, [
    isRegularIndexesEnabled,
    isSearchIndexesEnabled,
    startPollingRegularIndexes,
    startPollingSearchIndexes,
    stopPollingRegularIndexes,
    stopPollingSearchIndexes,
  ]);

  const isRefreshing =
    (isRegularIndexesEnabled && isRefreshingStatus(regularIndexes.status)) ||
    (isSearchIndexesEnabled && isRefreshingStatus(searchIndexes.status));

  const filteredRegularIndexes = useMemo(() => {
    if (!searchTerm) {
      return regularIndexes.indexes;
    }
    const regex = new RegExp(searchTerm, 'i');
    return regularIndexes.indexes.filter((x) => regex.test(x.name));
  }, [regularIndexes, searchTerm]);

  const filteredSearchIndexes = useMemo(() => {
    if (!searchTerm) {
      return searchIndexes.indexes;
    }
    const regex = new RegExp(searchTerm, 'i');
    return searchIndexes.indexes.filter((x) => regex.test(x.name));
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
          onClick={() => {
            if (isRegularIndexesEnabled) {
              refreshRegularIndexes();
            }
            if (isSearchIndexesEnabled) {
              refreshSearchIndexes();
            }
          }}
          variant="default"
          size="xsmall"
          leftGlyph={refreshButtonIcon}
        >
          Refresh
        </Button>
        <div className={gapContainerStyles}></div>
        <Menu
          open={menuOpen}
          setOpen={setMenuOpen}
          renderDarkMenu={false}
          trigger={({ onClick, children }: any) => {
            return (
              <div>
                <Button
                  data-testid="add-stage-menu-button"
                  size="xsmall"
                  variant="primary"
                  rightGlyph={
                    <Icon role="presentation" glyph="CaretDown"></Icon>
                  }
                  onClick={onClick}
                >
                  Create new
                </Button>
                {children}
              </div>
            );
          }}
        >
          <MenuItem
            onClick={createIndexOpened}
            data-text="Standard Index"
            disabled={!isRegularIndexesEnabled}
          >
            Standard Index
          </MenuItem>
          <MenuItem
            onClick={() => openCreateSearchIndexDrawerView('search')}
            data-text="Search Index"
            disabled={!isSearchIndexesEnabled}
          >
            Search Index
          </MenuItem>
          <MenuItem
            onClick={() => openCreateSearchIndexDrawerView('vectorSearch')}
            data-text="Vector Search Index"
            disabled={!isSearchIndexesEnabled}
          >
            Vector Search Index
          </MenuItem>
        </Menu>
      </div>
      <SearchInput
        aria-label="Indexes search"
        placeholder="Find by index name"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <CollapsibleSection label="Standard">
        {isRegularIndexesEnabled ? (
          filteredRegularIndexes.map((index) => (
            <div key={index.name}>{index.name}</div>
          ))
        ) : (
          <div>Standard indexes not enabled</div>
        )}
      </CollapsibleSection>
      <CollapsibleSection label="Search">
        {isSearchIndexesEnabled ? (
          filteredSearchIndexes.map((index) => (
            <div key={index.name}>{index.name}</div>
          ))
        ) : (
          <div>Search indexes not enabled</div>
        )}
      </CollapsibleSection>
    </div>
  );
};

const mapState = ({
  isSearchIndexesSupported,
  isReadonlyView,
  serverVersion,
  regularIndexes,
  searchIndexes,
  collectionStats,
}: RootState) => ({
  isSearchIndexesSupported,
  isReadonlyView,
  serverVersion,
  regularIndexes,
  searchIndexes,
  collectionStats,
});

const mapDispatch = {
  refreshRegularIndexes,
  refreshSearchIndexes,
  createIndexOpened,
  openCreateSearchIndexDrawerView,
  startPollingRegularIndexes,
  stopPollingRegularIndexes,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
};

export default connect(mapState, mapDispatch)(IndexesListDrawerView);
