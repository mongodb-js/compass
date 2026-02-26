import React, { useMemo } from 'react';
import type { Document } from 'mongodb';
import type { SearchIndex, SearchIndexStatus } from 'mongodb-data-service';
import {
  Badge,
  BadgeVariant,
  Disclaimer,
  Tooltip,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type { LGTableDataType } from '@mongodb-js/compass-components';

import BadgeWithIconLink from '../indexes-table/badge-with-icon-link';

export type SearchIndexInfo = {
  id: string;
  name: string;
  indexInfo: SearchIndex;
  status: React.ReactNode;
  type: React.ReactNode;
  actions: React.ReactNode;
  isVectorSearchIndex: boolean;
};

const statusBadgeVariants: Record<SearchIndexStatus, BadgeVariant> = {
  BUILDING: BadgeVariant.Blue,
  FAILED: BadgeVariant.Red,
  PENDING: BadgeVariant.Yellow,
  READY: BadgeVariant.Green,
  STALE: BadgeVariant.LightGray,
  DELETING: BadgeVariant.Red,
} as const;

export function IndexStatus({
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

export function SearchIndexType({
  type,
  link,
}: {
  type: string;
  link: string;
}) {
  return <BadgeWithIconLink text={type} link={link} />;
}

const searchIndexFieldStyles = css({
  // Override LeafyGreen's uppercase styles as we want to keep the case sensitivity of the key.
  textTransform: 'none',
  gap: spacing[100],
});

export const searchIndexDetailsStyles = css({
  display: 'inline-flex',
  gap: spacing[100],
  marginBottom: spacing[200],
  padding: `0px ${spacing[1600]}px`,
});

export const searchIndexDetailsForDrawerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
  padding: spacing[200],
  color: palette.gray.dark1,
});

export function VectorSearchIndexDetails({
  definition,
}: {
  definition: Document;
}) {
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
            trigger={({
              children: tooltipChildren,
              ...tooltipTriggerProps
            }: React.HTMLProps<HTMLDivElement>) => (
              <div {...tooltipTriggerProps}>
                <Badge className={searchIndexFieldStyles}>{field.path}</Badge>
                {tooltipChildren}
              </div>
            )}
          >
            {JSON.stringify(field, null, 2)}
          </Tooltip>
        ))
      )}
    </>
  );
}

export function SearchIndexDetails({ definition }: { definition: Document }) {
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

export function getIndexFields(
  definition: Document,
  isVectorSearchIndex: boolean
) {
  if (isVectorSearchIndex) {
    return (definition.fields as { path: string }[])
      .map((field) => `"${field.path}"`)
      .join(', ');
  }

  const fields = [];
  if (definition.mappings?.dynamic) {
    fields.push('[dynamic]');
  }

  return fields
    .concat(
      Object.keys((definition.mappings?.fields as Document) || {}).map(
        (field) => `"${field}"`
      )
    )
    .join(', ');
}

export type UseSearchIndexesTableProps = {
  indexes: SearchIndex[];
  renderActions: (
    index: SearchIndex,
    isVectorSearchIndex: boolean
  ) => React.ReactNode;
  // Use "Vector" for drawer, "Vector Search" for tab
  vectorTypeLabel?: 'Vector' | 'Vector Search';
  // Override the default expanded content renderer
  renderExpandedContentOverride?: (
    index: SearchIndex,
    isVectorSearchIndex: boolean
  ) => React.JSX.Element;
};

/**
 * Hook that returns search index data for rendering in tables.
 * Provides default renderExpandedContent and actions that can be overridden.
 */
export function useSearchIndexesTable({
  indexes,
  renderActions,
  vectorTypeLabel = 'Vector Search',
  renderExpandedContentOverride,
}: UseSearchIndexesTableProps) {
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
              type={isVectorSearchIndex ? vectorTypeLabel : 'Search'}
              link={
                isVectorSearchIndex
                  ? 'https://www.mongodb.com/docs/atlas/atlas-vector-search/create-index/'
                  : 'https://www.mongodb.com/docs/atlas/atlas-search/create-index/'
              }
            />
          ),
          indexInfo: index,
          isVectorSearchIndex,
          actions: renderActions(index, isVectorSearchIndex),
          renderExpandedContent: renderExpandedContentOverride
            ? () => renderExpandedContentOverride(index, isVectorSearchIndex)
            : () => (
                <div
                  className={searchIndexDetailsStyles}
                  data-testid={`search-indexes-details-${index.name}`}
                >
                  {isVectorSearchIndex ? (
                    <VectorSearchIndexDetails
                      definition={index.latestDefinition}
                    />
                  ) : (
                    <SearchIndexDetails definition={index.latestDefinition} />
                  )}
                </div>
              ),
        };
      }),
    [indexes, vectorTypeLabel, renderExpandedContentOverride, renderActions]
  );

  return { data };
}
