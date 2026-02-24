import React, { useCallback, useMemo } from 'react';
import { connect, useSelector } from 'react-redux';
import type { SearchIndex } from 'mongodb-data-service';
import {
  css,
  DropdownMenuButton,
  EmptyContent,
  LGTableDataType,
  Link,
} from '@mongodb-js/compass-components';

import { FetchStatuses } from '../../utils/fetch-status';
import { dropSearchIndex } from '../../modules/search-indexes';
import {
  openCreateSearchIndexDrawerView,
  openEditSearchIndexDrawerView,
  SearchIndexType,
} from '../../modules/indexes-drawer';
import type { FetchStatus } from '../../utils/fetch-status';
import { IndexesTable } from '../indexes-table';
import SearchIndexActions from './search-index-actions';
import type { RootState } from '../../modules';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { usePreferences } from 'compass-preferences-model/provider';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';
import type { SearchIndexInfo } from './use-search-indexes-table';
import {
  getIndexFields,
  searchIndexDetailsForDrawerStyles,
  useSearchIndexesTable,
} from './use-search-indexes-table';
import {
  COLUMNS_FOR_DRAWER,
  COLUMNS_FOR_DRAWER_WITH_ACTIONS,
} from './search-indexes-columns';
import { ZeroSearchIndexesGraphic } from '../icons/zero-search-indexes-graphic';

function isReadyStatus(status: FetchStatus) {
  return (
    status === FetchStatuses.READY ||
    status === FetchStatuses.REFRESHING ||
    status === FetchStatuses.POLLING
  );
}

const emptyContentStyles = css({
  marginTop: 0,
});

type ZeroStateProps = {
  isSearchIndexesWritable: boolean;
  onActionDispatch: (action: string) => void;
};

const ZeroState: React.FunctionComponent<ZeroStateProps> = ({
  isSearchIndexesWritable,
  onActionDispatch,
}) => {
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

type SearchIndexesDrawerTableProps = {
  indexes: SearchIndex[];
  status: FetchStatus;
  onDropIndexClick: (name: string) => void;
  onEditIndexClick: (name: string) => void;
  onCreateSearchIndexClick: (indexType: SearchIndexType) => void;
  searchTerm?: string;
};

export const SearchIndexesDrawerTable: React.FunctionComponent<
  SearchIndexesDrawerTableProps
> = ({
  indexes,
  status,
  searchTerm,
  onEditIndexClick,
  onDropIndexClick,
  onCreateSearchIndexClick,
}) => {
  const { atlasMetadata } = useConnectionInfo();
  const isAtlas = !!atlasMetadata;

  const { readOnly, readWrite, enableAtlasSearchIndexes } = usePreferences([
    'readOnly',
    'readWrite',
    'enableAtlasSearchIndexes',
  ]);

  const { isSearchIndexesWritable } = useSelector(
    selectReadWriteAccess({
      isAtlas,
      readOnly,
      readWrite,
      enableAtlasSearchIndexes,
    })
  );

  const onActionDispatch = useCallback(
    (action: string) => {
      switch (action) {
        case 'createSearchIndex':
          return onCreateSearchIndexClick('search');
        case 'createVectorSearchIndex':
          return onCreateSearchIndexClick('vectorSearch');
      }
    },
    [onCreateSearchIndexClick]
  );

  // Filter indexes based on search term
  const filteredIndexes = useMemo(() => {
    if (!searchTerm) {
      return indexes;
    }
    return indexes.filter((x) => x.name.includes(searchTerm));
  }, [indexes, searchTerm]);

  const { data: baseData } = useSearchIndexesTable({
    indexes: filteredIndexes,
    vectorTypeLabel: 'Vector',
  });

  // Extend base data with drawer-specific actions and renderExpandedContent
  const data = useMemo<LGTableDataType<SearchIndexInfo>[]>(
    () =>
      baseData.map((item) => ({
        ...item,
        actions: (
          <SearchIndexActions
            index={item.indexInfo}
            onDropIndex={onDropIndexClick}
            onEditIndex={onEditIndexClick}
          />
        ),
        renderExpandedContent() {
          return (
            <div className={searchIndexDetailsForDrawerStyles}>
              <div>
                <b>Status: </b>
                {item.indexInfo.status}
              </div>
              <div>
                <b>Index Fields: </b>
                {getIndexFields(
                  item.indexInfo.latestDefinition,
                  item.isVectorSearchIndex
                )}
              </div>
              <div>
                <b>Queryable: </b>
                {item.indexInfo.queryable.toString()}
              </div>
            </div>
          );
        },
      })),
    [baseData, onDropIndexClick, onEditIndexClick]
  );

  if (!isReadyStatus(status)) {
    return null;
  }

  // Show empty content if no indexes match the filter
  if (data.length === 0) {
    return (
      <ZeroState
        isSearchIndexesWritable={isSearchIndexesWritable}
        onActionDispatch={onActionDispatch}
      />
    );
  }

  return (
    <IndexesTable
      id="search-indexes"
      data-testid="search-indexes"
      columns={
        isSearchIndexesWritable
          ? COLUMNS_FOR_DRAWER_WITH_ACTIONS
          : COLUMNS_FOR_DRAWER
      }
      data={data}
      isDrawer={true}
    />
  );
};

const mapState = ({ searchIndexes }: RootState) => ({
  status: searchIndexes.status,
  indexes: searchIndexes.indexes,
});

const mapDispatch = {
  onDropIndexClick: dropSearchIndex,
  onEditIndexClick: openEditSearchIndexDrawerView,
  onCreateSearchIndexClick: openCreateSearchIndexDrawerView,
};

export default connect(mapState, mapDispatch)(SearchIndexesDrawerTable);
