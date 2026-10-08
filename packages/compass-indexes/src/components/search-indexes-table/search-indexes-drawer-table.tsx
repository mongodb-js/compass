import React, { useCallback, useMemo } from 'react';
import { connect, useSelector, shallowEqual } from 'react-redux';
import type { SearchIndex } from 'mongodb-data-service';
import {
  Body,
  css,
  DropdownMenuButton,
  EmptyContent,
  InlineDefinition,
  Link,
  nbsp,
  spacing,
  Translated,
  useTranslation,
} from '@mongodb-js/compass-components';

import { isReadyStatus } from '../../utils/fetch-status';
import { dropSearchIndex } from '../../modules/search-indexes';
import {
  openCreateSearchIndexDrawerView,
  openEditSearchIndexDrawerView,
  setExpandedRows,
} from '../../modules/indexes-drawer';
import type { SearchIndexType } from '../../modules/indexes-drawer';
import type { FetchStatus } from '../../utils/fetch-status';
import { IndexesTable } from '../indexes-table';
import SearchIndexActions from './search-index-actions';
import type { RootState } from '../../modules';
import { usePreferences } from 'compass-preferences-model/provider';
import {
  useSearchActivationProgramP1,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';
import {
  getIndexFields,
  useSearchIndexesTable,
} from './use-search-indexes-table';
import {
  COLUMNS_FOR_DRAWER,
  COLUMNS_FOR_DRAWER_WITH_ACTIONS,
} from './search-indexes-columns';
import { ZeroSearchIndexesGraphic } from '../icons/zero-search-indexes-graphic';

const searchIndexDetailsForDrawerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
  padding: spacing[200],
});

export function renderNameOverride(name: string): React.ReactNode {
  const preserved = nbsp(name);
  if (preserved.length > 10) {
    return (
      <InlineDefinition definition={preserved}>{`${preserved.slice(
        0,
        10
      )}…`}</InlineDefinition>
    );
  }

  return preserved;
}

function renderTypeOverride(index: SearchIndex): React.ReactNode {
  return index.type === 'vectorSearch' ? (
    <Translated id="indexes.searchDrawer.typeVector">Vector</Translated>
  ) : (
    <Translated id="indexes.searchDrawer.typeSearch">Search</Translated>
  );
}

function renderExpandedContentOverride(
  index: SearchIndex,
  isVectorSearchIndex: boolean
): React.JSX.Element {
  return (
    <Body className={searchIndexDetailsForDrawerStyles}>
      <div>
        <b>
          <Translated id="indexes.searchDrawer.indexName">
            {'Index Name: '}
          </Translated>
        </b>
        {nbsp(index.name)}
      </div>
      <div>
        <b>
          <Translated id="indexes.searchDrawer.status">{'Status: '}</Translated>
        </b>
        {index.status}
      </div>
      <div>
        <b>
          <Translated id="indexes.searchDrawer.indexFields">
            {'Index Fields: '}
          </Translated>
        </b>
        {getIndexFields(index.latestDefinition, isVectorSearchIndex)}
      </div>
      <div>
        <b>
          <Translated id="indexes.searchDrawer.queryable">
            {'Queryable: '}
          </Translated>
        </b>
        {index.queryable.toString()}
      </div>
    </Body>
  );
}

const emptyContentStyles = css({
  marginTop: 0,
});

const tableWrapperStyles = css({
  overflowX: 'auto',
});

const drawerCellStyles = css({
  ':first-of-type': {
    paddingLeft: 0,
  },
  ':last-of-type': {
    paddingRight: 0,
  },
});

type ZeroStateProps = {
  isSearchIndexesWritable: boolean;
  onActionDispatch: (action: string) => void;
};

const ZeroState: React.FunctionComponent<ZeroStateProps> = ({
  isSearchIndexesWritable,
  onActionDispatch,
}) => {
  const t = useTranslation();
  return (
    <EmptyContent
      containerClassName={emptyContentStyles}
      icon={ZeroSearchIndexesGraphic}
      title={t('indexes.searchDrawer.noIndexes', 'No search indexes found')}
      subTitle={
        <span>
          {t('indexes.searchDrawer.defineA', 'Define a')}{' '}
          <Link
            href="https://www.mongodb.com/docs/atlas/atlas-search/manage-indexes/"
            target="_blank"
          >
            {t('indexes.searchDrawer.search', 'search')}
          </Link>{' '}
          {t('indexes.searchDrawer.or', 'or')}{' '}
          <Link
            href="https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/"
            target="_blank"
          >
            {t('indexes.searchDrawer.vectorSearchIndex', 'vector search index')}
          </Link>{' '}
          {t(
            'indexes.searchDrawer.toStartUsing',
            'to start using $search or $vectorSearch.'
          )}
        </span>
      }
      callToActionLink={
        <DropdownMenuButton
          buttonText={t(
            'indexes.searchDrawer.createSearchIndex',
            'Create a search index'
          )}
          buttonProps={{
            size: 'xsmall',
            disabled: !isSearchIndexesWritable,
          }}
          actions={[
            {
              action: 'createSearchIndex',
              label: t('indexes.searchDrawer.menuSearchIndex', 'Search Index'),
            },
            {
              action: 'createVectorSearchIndex',
              label: t(
                'indexes.searchDrawer.menuVectorSearchIndex',
                'Vector Search Index'
              ),
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
  onExpandedChange: (expandedRows: Record<string, boolean>) => void;
  searchTerm?: string;
  expandedRows: Record<string, boolean>;
};

export const SearchIndexesDrawerTable: React.FunctionComponent<
  SearchIndexesDrawerTableProps
> = ({
  indexes,
  status,
  searchTerm,
  expandedRows,
  onEditIndexClick,
  onDropIndexClick,
  onCreateSearchIndexClick,
  onExpandedChange,
}) => {
  const track = useTelemetry();

  const {
    readOnly,
    readWrite,
    enableAtlasSearchIndexes,
    enableIndexesManagement,
  } = usePreferences([
    'readOnly',
    'readWrite',
    'enableAtlasSearchIndexes',
    'enableIndexesManagement',
  ]);
  const { enableSearchActivationProgramP1 } = useSearchActivationProgramP1();
  const { isSearchIndexesWritable } = useSelector(
    selectReadWriteAccess({
      readOnly,
      readWrite,
      enableAtlasSearchIndexes,
      enableSearchActivationProgramP1,
      enableIndexesManagement,
    }),
    shallowEqual
  );

  const onActionDispatch = useCallback(
    (action: string) => {
      switch (action) {
        case 'createSearchIndex':
          track('Index Create Action Clicked', {
            context: 'Search Indexes Drawer Table',
            index_type: 'search',
          });
          return onCreateSearchIndexClick('search');
        case 'createVectorSearchIndex':
          track('Index Create Action Clicked', {
            context: 'Search Indexes Drawer Table',
            index_type: 'vectorSearch',
          });
          return onCreateSearchIndexClick('vectorSearch');
      }
    },
    [onCreateSearchIndexClick, track]
  );

  const renderActions = useCallback(
    (index: SearchIndex) => {
      return (
        <SearchIndexActions
          index={index}
          context="Search Indexes Drawer Table"
          onDropIndex={onDropIndexClick}
          onEditIndex={onEditIndexClick}
        />
      );
    },
    [onDropIndexClick, onEditIndexClick]
  );

  const { data: allData } = useSearchIndexesTable({
    indexes,
    renderNameOverride,
    renderTypeOverride,
    renderActions,
    renderExpandedContentOverride,
  });

  // Filter data based on search term
  const data = useMemo(() => {
    if (!searchTerm) {
      return allData;
    }
    return allData.filter((item) => item.name.includes(searchTerm));
  }, [allData, searchTerm]);

  const handleExpandedChange = useCallback(
    (newExpanded: true | Record<string, boolean>) => {
      if (newExpanded === true) {
        return;
      }
      onExpandedChange(newExpanded);
    },
    [onExpandedChange]
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
      expanded={expandedRows}
      onExpandedChange={handleExpandedChange}
      tableWrapperClassName={tableWrapperStyles}
      cellClassName={drawerCellStyles}
      showActionsOnHover={false}
    />
  );
};

const mapState = ({ searchIndexes, indexesDrawer }: RootState) => ({
  status: searchIndexes.status,
  indexes: searchIndexes.indexes,
  expandedRows: indexesDrawer.expandedRows,
});

const mapDispatch = {
  onDropIndexClick: dropSearchIndex,
  onEditIndexClick: openEditSearchIndexDrawerView,
  onCreateSearchIndexClick: openCreateSearchIndexDrawerView,
  onExpandedChange: setExpandedRows,
};

export default connect(mapState, mapDispatch)(SearchIndexesDrawerTable);
