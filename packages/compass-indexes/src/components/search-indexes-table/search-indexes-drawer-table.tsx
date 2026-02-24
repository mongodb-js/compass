import React, { useMemo } from 'react';
import { connect, useSelector } from 'react-redux';
import type { SearchIndex } from 'mongodb-data-service';
import type { LGTableDataType } from '@mongodb-js/compass-components';

import { FetchStatuses } from '../../utils/fetch-status';
import { dropSearchIndex } from '../../modules/search-indexes';
import { openEditSearchIndexDrawerView } from '../../modules/indexes-drawer';
import type { FetchStatus } from '../../utils/fetch-status';
import { IndexesTable } from '../indexes-table';
import SearchIndexActions from './search-index-actions';
import type { RootState, IndexesThunkDispatch } from '../../modules';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { usePreferences } from 'compass-preferences-model/provider';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';

import {
  type SearchIndexInfo,
  getIndexFields,
  searchIndexDetailsForDrawerStyles,
  useSearchIndexesTable,
} from './use-search-indexes-table';
import {
  COLUMNS_FOR_DRAWER,
  COLUMNS_FOR_DRAWER_WITH_ACTIONS,
} from './search-indexes-columns';

function isReadyStatus(status: FetchStatus) {
  return (
    status === FetchStatuses.READY ||
    status === FetchStatuses.REFRESHING ||
    status === FetchStatuses.POLLING
  );
}

type SearchIndexesDrawerTableProps = {
  indexes: SearchIndex[];
  status: FetchStatus;
  onDropIndexClick: (name: string) => void;
  onEditIndexClick: (name: string) => void;
  onSearchIndexesOpened: (tabId: string) => void;
  onSearchIndexesClosed: (tabId: string) => void;
};

export const SearchIndexesDrawerTable: React.FunctionComponent<
  SearchIndexesDrawerTableProps
> = ({ indexes, status, onEditIndexClick, onDropIndexClick }) => {
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

  const { data: baseData } = useSearchIndexesTable({
    indexes,
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

  if (indexes.length === 0) {
    return null;
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
});

const mapDispatch = (dispatch: IndexesThunkDispatch) => ({
  onDropIndexClick: dropSearchIndex,
  onEditIndexClick: openEditSearchIndexDrawerView,
});

export default connect(mapState, mapDispatch)(SearchIndexesDrawerTable);
