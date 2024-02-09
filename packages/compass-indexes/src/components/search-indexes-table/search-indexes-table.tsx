import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import type { SearchIndex, SearchIndexStatus } from 'mongodb-data-service';
import { withPreferences } from 'compass-preferences-model/provider';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import { BadgeVariant, Disclaimer } from '@mongodb-js/compass-components';
import {
  EmptyContent,
  Button,
  Link,
  Badge,
  Tooltip,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { SearchSortColumn } from '../../modules/search-indexes';
import {
  SearchIndexesStatuses,
  dropSearchIndex,
  getInitialSearchIndexPipeline,
  getInitialVectorSearchIndexPipelineText,
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
import BadgeWithIconLink from '../indexes-table/badge-with-icon-link';

export const POLLING_INTERVAL = 5000;

type SearchIndexesTableProps = {
  namespace: string;
  indexes: SearchIndex[];
  isWritable?: boolean;
  readOnly?: boolean;
  onSortTable: (column: SearchSortColumn, direction: SortDirection) => void;
  onDropIndex: (name: string) => void;
  onEditIndex: (name: string) => void;
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

function SearchIndexType({ type, link }: { type: string; link: string }) {
  return <BadgeWithIconLink text={type} link={link} />;
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
            trigger={({ children, ...props }) => (
              <Badge {...props} className={searchIndexFieldStyles}>
                {children}
                {field.path}
              </Badge>
            )}
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

const COLUMNS = ['Name and Fields', 'Type', 'Status'] as const;

export const SearchIndexesTable: React.FunctionComponent<
  SearchIndexesTableProps
> = ({
  namespace,
  indexes,
  isWritable,
  readOnly,
  onSortTable,
  openCreateModal,
  onEditIndex,
  status,
  onDropIndex,
  onPollIndexes,
}) => {
  const { openCollectionWorkspace } = useOpenWorkspace();

  useEffect(() => {
    const id = setInterval(onPollIndexes, POLLING_INTERVAL);
    return () => {
      clearInterval(id);
    };
  }, [onPollIndexes]);

  const data = useMemo(() => {
    return indexes.map((index) => {
      const isVectorSearchIndex = index.type === 'vectorSearch';
      return {
        key: index.name,
        'data-testid': `row-${index.name}`,
        fields: [
          {
            'data-testid': 'name-field',
            style: {
              width: '30%',
            },
            children: index.name,
          },
          {
            'data-testid': 'type-field',
            style: {
              width: '20%',
            },
            children: (
              <SearchIndexType
                type={isVectorSearchIndex ? 'Vector Search' : 'Search'}
                link={
                  isVectorSearchIndex
                    ? 'https://www.mongodb.com/docs/atlas/atlas-vector-search/create-index/'
                    : 'https://www.mongodb.com/docs/atlas/atlas-search/create-index/'
                }
              />
            ),
          },
          {
            'data-testid': 'status-field',
            style: {
              width: '20%',
            },
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
            onRunAggregateIndex={(name) => {
              openCollectionWorkspace(namespace, {
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
        details: (
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
    });
  }, [indexes, namespace, onDropIndex, onEditIndex, openCollectionWorkspace]);

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
      aria-label="Search Indexes"
      canModifyIndex={canModifyIndex}
      columns={COLUMNS}
      data={data}
      onSortTable={onSortTable}
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
  onSortTable: sortSearchIndexes,
  onDropIndex: dropSearchIndex,
  openCreateModal: showCreateModal,
  onEditIndex: showUpdateModal,
  onPollIndexes: pollSearchIndexes,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(SearchIndexesTable, ['readOnly']));
