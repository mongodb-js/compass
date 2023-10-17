import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import type { SearchIndex, SearchIndexStatus } from 'mongodb-data-service';
import { withPreferences } from 'compass-preferences-model';

import { BadgeVariant } from '@mongodb-js/compass-components';
import {
  EmptyContent,
  Button,
  Link,
  Badge,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { SearchSortColumn } from '../../modules/search-indexes';
import {
  SearchIndexesStatuses,
  dropSearchIndex,
  runAggregateSearchIndex,
  pollSearchIndexes,
  showCreateModal,
  showUpdateModal,
} from '../../modules/search-indexes';
import type { SearchIndexesStatus } from '../../modules/search-indexes';
import { sortSearchIndexes } from '../../modules/search-indexes';
import type { SortDirection, RootState } from '../../modules';

import { IndexesTable } from '../indexes-table';
import IndexActions from './search-index-actions';
import { ZeroGraphic } from './zero-graphic';

export const POLLING_INTERVAL = 5000;

type SearchIndexesTableProps = {
  indexes: SearchIndex[];
  isWritable?: boolean;
  readOnly?: boolean;
  onSortTable: (column: SearchSortColumn, direction: SortDirection) => void;
  onDropIndex: (name: string) => void;
  onEditIndex: (name: string) => void;
  onRunAggregateIndex: (name: string) => void;
  openCreateModal: () => void;
  onPollIndexes: () => void;
  status: SearchIndexesStatus;
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

export const SearchIndexesTable: React.FunctionComponent<
  SearchIndexesTableProps
> = ({
  indexes,
  isWritable,
  readOnly,
  onSortTable,
  openCreateModal,
  onEditIndex,
  status,
  onDropIndex,
  onRunAggregateIndex,
  onPollIndexes,
}) => {
  useEffect(() => {
    const id = setInterval(onPollIndexes, POLLING_INTERVAL);
    return () => {
      clearInterval(id);
    };
  }, [onPollIndexes]);

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

  const columns = ['Name and Fields', 'Status'] as const;

  const data = indexes.map((index) => {
    return {
      key: index.name,
      'data-testid': `row-${index.name}`,
      fields: [
        {
          'data-testid': 'name-field',
          className: css({
            width: '30%',
          }),
          children: index.name,
        },
        {
          'data-testid': 'status-field',
          className: css({
            width: '20%',
          }),
          children: (
            <IndexStatus
              status={index.status}
              data-testid={`search-indexes-status-${index.name}`}
            />
          ),
        },
      ],
      actions: (
        <IndexActions
          index={index}
          onDropIndex={onDropIndex}
          onEditIndex={onEditIndex}
          onRunAggregateIndex={onRunAggregateIndex}
        />
      ),
      // TODO(COMPASS-7206): details for the nested row
      details: (
        <SearchIndexDetails
          indexName={index.name}
          definition={index.latestDefinition}
        />
      ),
    };
  });

  return (
    <IndexesTable
      data-testid="search-indexes"
      aria-label="Search Indexes"
      canModifyIndex={canModifyIndex}
      columns={columns}
      data={data}
      onSortTable={(column, direction) => onSortTable(column, direction)}
    />
  );
};

const mapState = ({ searchIndexes, isWritable }: RootState) => ({
  isWritable,
  indexes: searchIndexes.indexes,
  status: searchIndexes.status,
});

const mapDispatch = {
  onSortTable: sortSearchIndexes,
  onDropIndex: dropSearchIndex,
  onRunAggregateIndex: runAggregateSearchIndex,
  openCreateModal: showCreateModal,
  onEditIndex: showUpdateModal,
  onPollIndexes: pollSearchIndexes,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(SearchIndexesTable, ['readOnly'], React));
