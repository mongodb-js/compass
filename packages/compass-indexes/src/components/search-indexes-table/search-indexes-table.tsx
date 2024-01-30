import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import type { SearchIndex, SearchIndexStatus } from 'mongodb-data-service';
import { withPreferences } from 'compass-preferences-model/provider';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  Badge,
  BadgeVariant,
  Button,
  EmptyContent,
  Link,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type {
  LGColumnDef,
  LeafyGreenTableRow,
  LGTableDataType,
} from '@mongodb-js/compass-components';

import {
  SearchIndexesStatuses,
  dropSearchIndex,
  getInitialSearchIndexPipeline,
  pollSearchIndexes,
  showCreateModal,
  showUpdateModal,
} from '../../modules/search-indexes';
import type { SearchIndexesStatus } from '../../modules/search-indexes';
import { IndexesTable } from '../indexes-table';
import SearchIndexActions from './search-index-actions';
import { ZeroGraphic } from './zero-graphic';
import type { RootState } from '../../modules';

export const POLLING_INTERVAL = 5000;

type SearchIndexesTableProps = {
  namespace: string;
  indexes: SearchIndex[];
  isWritable?: boolean;
  readOnly?: boolean;
  onDropIndex: (name: string) => void;
  onEditIndex: (name: string) => void;
  openCreateModal: () => void;
  onPollIndexes: () => void;
  status: SearchIndexesStatus;
  pollingInterval?: number;
};

function isReadyStatus(status: SearchIndexesStatus) {
  return (
    status === SearchIndexesStatuses.READY ||
    status === SearchIndexesStatuses.REFRESHING ||
    status === SearchIndexesStatuses.POLLING
  );
}

function ZeroState({ openCreateModal }: { openCreateModal: () => void }) {
  return (
    <EmptyContent
      icon={ZeroGraphic}
      title="No search indexes yet"
      subTitle="Atlas Search is an embedded full-text search in MongoDB Atlas that gives you a seamless, scalable experience for building relevance-based app features."
      callToAction={
        <Button
          onClick={openCreateModal}
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

function SearchIndexDetails({
  indexName,
  definition,
}: {
  indexName: string;
  definition: Document;
}) {
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
    <div
      className={searchIndexDetailsStyles}
      data-testid={`search-indexes-details-${indexName}`}
    >
      {badges.length === 0
        ? '[empty]'
        : badges.map((badge) => (
            <Badge key={badge.name} className={badge.className}>
              {badge.name}
            </Badge>
          ))}
    </div>
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

const COLUMNS: LGColumnDef<SearchIndexInfo>[] = [
  {
    accessorKey: 'name',
    header: 'Name and Fields',
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
  openCreateModal,
  onEditIndex,
  status,
  onDropIndex,
  onPollIndexes,
  pollingInterval = POLLING_INTERVAL,
}) => {
  const { openCollectionWorkspace } = useOpenWorkspace();

  useEffect(() => {
    const id = setInterval(onPollIndexes, pollingInterval);
    return () => {
      clearInterval(id);
    };
  }, [onPollIndexes, pollingInterval]);

  const data = useMemo<LGTableDataType<SearchIndexInfo>[]>(
    () =>
      indexes.map((index) => ({
        id: index.name,
        name: index.name,
        status: (
          <IndexStatus
            status={index.status}
            data-testid={`search-indexes-status-${index.name}`}
          />
        ),
        indexInfo: index,
        actions: (
          <SearchIndexActions
            index={index}
            onDropIndex={onDropIndex}
            onEditIndex={onEditIndex}
            onRunAggregateIndex={(name) => {
              openCollectionWorkspace(namespace, {
                initialPipeline: getInitialSearchIndexPipeline(name),
                newTab: true,
              });
            }}
          />
        ),
        // eslint-disable-next-line react/display-name
        renderExpandedContent: () => (
          <SearchIndexDetails
            indexName={index.name}
            definition={index.latestDefinition}
          />
        ),
      })),
    [indexes, namespace, onDropIndex, onEditIndex, openCollectionWorkspace]
  );

  if (!isReadyStatus(status)) {
    // If there's an error or the search indexes are still pending or search
    // indexes aren't available, then that's all handled by the toolbar and we
    // don't render the table.
    return null;
  }

  if (indexes.length === 0) {
    return <ZeroState openCreateModal={openCreateModal} />;
  }

  const canModifyIndex = isWritable && !readOnly;

  return (
    <IndexesTable
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
  onDropIndex: dropSearchIndex,
  openCreateModal: showCreateModal,
  onEditIndex: showUpdateModal,
  onPollIndexes: pollSearchIndexes,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(SearchIndexesTable, ['readOnly']));
