import React, { useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import type { SearchIndex, SearchIndexStatus } from 'mongodb-data-service';
import { withPreferences } from 'compass-preferences-model/provider';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  Badge,
  BadgeVariant,
  Button,
  Disclaimer,
  EmptyContent,
  Link,
  Tooltip,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type {
  LGColumnDef,
  LeafyGreenTableRow,
  LGTableDataType,
} from '@mongodb-js/compass-components';

import { FetchStatuses } from '../../utils/fetch-status';
import {
  dropSearchIndex,
  getInitialSearchIndexPipeline,
  getInitialVectorSearchIndexPipelineText,
  createSearchIndexOpened,
  updateSearchIndexOpened,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
} from '../../modules/search-indexes';
import type { FetchStatus } from '../../utils/fetch-status';
import { IndexesTable } from '../indexes-table';
import SearchIndexActions from './search-index-actions';
import { ZeroGraphic } from './zero-graphic';
import type { RootState } from '../../modules';
import BadgeWithIconLink from '../indexes-table/badge-with-icon-link';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';

type SearchIndexesTableProps = {
  namespace: string;
  indexes: SearchIndex[];
  isWritable?: boolean;
  readOnly?: boolean;
  status: FetchStatus;
  onDropIndexClick: (name: string) => void;
  onEditIndexClick: (name: string) => void;
  onOpenCreateModalClick: () => void;
  onSearchIndexesOpened: () => void;
  onSearchIndexesClosed: () => void;
};

function isReadyStatus(status: FetchStatus) {
  return (
    status === FetchStatuses.READY ||
    status === FetchStatuses.REFRESHING ||
    status === FetchStatuses.POLLING
  );
}

function ZeroState({
  onOpenCreateModalClick,
}: {
  onOpenCreateModalClick: () => void;
}) {
  return (
    <EmptyContent
      icon={ZeroGraphic}
      title="No search indexes yet"
      subTitle="Atlas Search is an embedded full-text search in MongoDB Atlas that gives you a seamless, scalable experience for building relevance-based app features."
      callToAction={
        <Button
          onClick={onOpenCreateModalClick}
          data-testid="create-atlas-search-index-button"
          variant="primary"
          size="small"
        >
          Create Atlas Search Index
        </Button>
      }
      callToActionLink={
        <span>
          Not sure where to start?&nbsp;
          <Link
            href="https://www.mongodb.com/docs/atlas/atlas-search/"
            target="_blank"
          >
            Visit our Docs
          </Link>
        </span>
      }
    />
  );
}

const statusBadgeVariants: Record<SearchIndexStatus, BadgeVariant> = {
  BUILDING: BadgeVariant.Blue,
  FAILED: BadgeVariant.Red,
  PENDING: BadgeVariant.Yellow,
  READY: BadgeVariant.Green,
  STALE: BadgeVariant.LightGray,
  DELETING: BadgeVariant.Red,
};

function IndexStatus({
  status,
  'data-testid': dataTestId,
}: {
  status: SearchIndexStatus;
  'data-testid': string;
}) {
  const variant = statusBadgeVariants[status];
  return (
    <Badge variant={variant} data-testid={dataTestId}>
      {status}
    </Badge>
  );
}

function SearchIndexType({ type, link }: { type: string; link: string }) {
  return <BadgeWithIconLink text={type} link={link} />;
}

const searchIndexDetailsStyles = css({
  display: 'inline-flex',
  gap: spacing[1],
  marginBottom: spacing[2],
  padding: `0px ${spacing[6]}px`,
});

const searchIndexFieldStyles = css({
  // Override LeafyGreen's uppercase styles as we want to keep the case sensitivity of the key.
  textTransform: 'none',
  gap: spacing[1],
});

function VectorSearchIndexDetails({ definition }: { definition: Document }) {
  return (
    <>
      {!definition.fields || definition.fields.length === 0 ? (
        <Disclaimer>No fields in the index definition.</Disclaimer>
      ) : (
        definition.fields.map((field: { path: string }) => (
          <Tooltip
            align="top"
            key={field.path}
            justify="middle"
            trigger={
              <Badge className={searchIndexFieldStyles}>{field.path}</Badge>
            }
          >
            {JSON.stringify(field, null, 2)}
          </Tooltip>
        ))
      )}
    </>
  );
}

function SearchIndexDetails({ definition }: { definition: Document }) {
  const badges: { name: string; className?: string }[] = [];

  if (definition.mappings?.dynamic) {
    badges.push({
      name: 'Dynamic Mappings',
      className: undefined,
    });
  }

  if (definition.mappings?.fields) {
    badges.push(
      ...Object.keys(definition.mappings.fields as Document).map((name) => ({
        name,
        className: searchIndexFieldStyles,
      }))
    );
  }
  return (
    <>
      {badges.length === 0 ? (
        <Disclaimer>No mappings in the index definition.</Disclaimer>
      ) : (
        badges.map((badge) => (
          <Badge key={badge.name} className={badge.className}>
            {badge.name}
          </Badge>
        ))
      )}
    </>
  );
}

type SearchIndexInfo = {
  id: string;
  name: string;
  indexInfo: SearchIndex;
  status: React.ReactNode;
  actions: React.ReactNode;
  renderExpandedContent: React.ReactNode;
};

function sortByStatus(
  rowA: LeafyGreenTableRow<SearchIndexInfo>,
  rowB: LeafyGreenTableRow<SearchIndexInfo>
) {
  if (typeof rowB.original.indexInfo.status === 'undefined') {
    return -1;
  }
  if (typeof rowA.original.indexInfo.status === 'undefined') {
    return 1;
  }
  if (rowA.original.indexInfo.status > rowB.original.indexInfo.status) {
    return -1;
  }
  if (rowA.original.indexInfo.status < rowB.original.indexInfo.status) {
    return 1;
  }
  return 0;
}

function sortByType(
  rowA: LeafyGreenTableRow<SearchIndexInfo>,
  rowB: LeafyGreenTableRow<SearchIndexInfo>
) {
  if (typeof rowB.original.indexInfo.type === 'undefined') {
    return -1;
  }
  if (typeof rowA.original.indexInfo.type === 'undefined') {
    return 1;
  }
  if (rowA.original.indexInfo.type > rowB.original.indexInfo.type) {
    return -1;
  }
  if (rowA.original.indexInfo.type < rowB.original.indexInfo.type) {
    return 1;
  }
  return 0;
}

const COLUMNS: LGColumnDef<SearchIndexInfo>[] = [
  {
    accessorKey: 'name',
    header: 'Name and Fields',
    enableSorting: true,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: (info) => info.getValue(),
    sortingFn: sortByType,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => info.getValue(),
    sortingFn: sortByStatus,
    enableSorting: true,
  },
];

const COLUMNS_WITH_ACTIONS: LGColumnDef<SearchIndexInfo>[] = [
  ...COLUMNS,
  {
    accessorKey: 'actions',
    header: '',
    cell: (info) => info.getValue(),
  },
];

export const SearchIndexesTable: React.FunctionComponent<
  SearchIndexesTableProps
> = ({
  namespace,
  indexes,
  isWritable,
  readOnly,
  status,
  onOpenCreateModalClick,
  onEditIndexClick,
  onDropIndexClick,
  onSearchIndexesOpened,
  onSearchIndexesClosed,
}) => {
  const { openCollectionWorkspace } = useOpenWorkspace();
  const { id: connectionId } = useConnectionInfo();

  useEffect(() => {
    onSearchIndexesOpened();
    return () => {
      onSearchIndexesClosed();
    };
  }, [onSearchIndexesOpened, onSearchIndexesClosed]);

  const data = useMemo<LGTableDataType<SearchIndexInfo>[]>(
    () =>
      indexes.map((index) => {
        const isVectorSearchIndex = index.type === 'vectorSearch';

        return {
          id: index.name,
          name: index.name,
          status: (
            <IndexStatus
              status={index.status}
              data-testid={`search-indexes-status-${index.name}`}
            />
          ),
          type: (
            <SearchIndexType
              type={isVectorSearchIndex ? 'Vector Search' : 'Search'}
              link={
                isVectorSearchIndex
                  ? 'https://www.mongodb.com/docs/atlas/atlas-vector-search/create-index/'
                  : 'https://www.mongodb.com/docs/atlas/atlas-search/create-index/'
              }
            />
          ),
          indexInfo: index,
          actions: (
            <SearchIndexActions
              index={index}
              onDropIndex={onDropIndexClick}
              onEditIndex={onEditIndexClick}
              onRunAggregateIndex={(name) => {
                openCollectionWorkspace(connectionId, namespace, {
                  newTab: true,
                  ...(isVectorSearchIndex
                    ? {
                        initialPipelineText:
                          getInitialVectorSearchIndexPipelineText(name),
                      }
                    : {
                        initialPipeline: getInitialSearchIndexPipeline(name),
                      }),
                });
              }}
            />
          ),
          // eslint-disable-next-line react/display-name
          renderExpandedContent: () => (
            <div
              className={searchIndexDetailsStyles}
              data-testid={`search-indexes-details-${index.name}`}
            >
              {isVectorSearchIndex ? (
                <VectorSearchIndexDetails definition={index.latestDefinition} />
              ) : (
                <SearchIndexDetails definition={index.latestDefinition} />
              )}
            </div>
          ),
        };
      }),
    [
      connectionId,
      indexes,
      namespace,
      onDropIndexClick,
      onEditIndexClick,
      openCollectionWorkspace,
    ]
  );

  if (!isReadyStatus(status)) {
    // If there's an error or the search indexes are still pending or search
    // indexes aren't available, then that's all handled by the toolbar and we
    // don't render the table.
    return null;
  }

  if (indexes.length === 0) {
    return <ZeroState onOpenCreateModalClick={onOpenCreateModalClick} />;
  }

  const canModifyIndex = isWritable && !readOnly;

  return (
    <IndexesTable
      id="search-indexes"
      data-testid="search-indexes"
      columns={canModifyIndex ? COLUMNS_WITH_ACTIONS : COLUMNS}
      data={data}
    />
  );
};

const mapState = ({ searchIndexes, isWritable, namespace }: RootState) => ({
  namespace,
  isWritable,
  indexes: searchIndexes.indexes,
  status: searchIndexes.status,
});

const mapDispatch = {
  onDropIndexClick: dropSearchIndex,
  onOpenCreateModalClick: createSearchIndexOpened,
  onEditIndexClick: updateSearchIndexOpened,
  onSearchIndexesOpened: startPollingSearchIndexes,
  onSearchIndexesClosed: stopPollingSearchIndexes,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(SearchIndexesTable, ['readOnly']));
