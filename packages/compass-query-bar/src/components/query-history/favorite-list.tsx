import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  applyFromHistory,
  deleteFavoriteQuery,
} from '../../stores/query-bar-reducer';
import type { FavoriteQuery } from '../../utils/query-storage';
import { ZeroGraphic } from './zero-graphic';
import {
  QueryItemCard,
  QueryItemContent,
  QueryItemHeading,
  CopyActionButton,
  DeleteActionButton,
} from './query-item';
import { formatQuery, copyToClipboard, getQueryAttributes } from '../../utils';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { BaseQuery } from '../../constants/query-properties';
import type { RootState } from '../../stores/query-bar-store';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

type FavoriteActions = {
  onApply: (query: BaseQuery) => void;
  onDelete: (id: string) => void;
};

const FavoriteItem = ({
  query,
  onApply,
  onDelete,
}: FavoriteActions & {
  query: FavoriteQuery;
}) => {
  const attributes = useMemo(() => getQueryAttributes(query), [query]);
  const onCardClick = useCallback(() => {
    track('Query History Favorite Used', {
      id: query._id,
      screen: 'documents',
    });
    onApply(attributes);
  }, [onApply, query._id, attributes]);

  const onDeleteClick = useCallback(() => {
    track('Query History Favorite Removed', {
      id: query._id,
      screen: 'documents',
    });
    onDelete(query._id);
  }, [onDelete, query._id]);

  return (
    <QueryItemCard
      key={query._id}
      onClick={onCardClick}
      data-testid="favorite-query-list-item"
      header={(isHovered: boolean) => (
        <QueryItemHeading title={query._name} isHovered={isHovered}>
          <CopyActionButton
            onClick={() => copyToClipboard(formatQuery(attributes))}
          />
          <DeleteActionButton onClick={onDeleteClick} />
        </QueryItemHeading>
      )}
    >
      <QueryItemContent query={attributes} />
    </QueryItemCard>
  );
};

const FavoriteList = ({
  queries,
  onApply,
  onDelete,
}: FavoriteActions & {
  queries: FavoriteQuery[];
}) => {
  if (queries.length === 0) {
    return <ZeroGraphic text={'Your favorite queries will appear here.'} />;
  }
  const content = queries.map((query) => (
    <FavoriteItem
      key={query._id}
      query={query}
      onApply={onApply}
      onDelete={onDelete}
    />
  ));
  return <>{content}</>;
};

export default connect(
  ({ queryBar: { favoriteQueries } }: RootState) => ({
    queries: favoriteQueries,
  }),
  {
    onApply: applyFromHistory,
    onDelete: deleteFavoriteQuery,
  }
)(FavoriteList);
