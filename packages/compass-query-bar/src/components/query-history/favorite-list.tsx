import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  applyFromHistory,
  deleteFavoriteQuery,
} from '../../stores/query-bar-reducer';
import type { FavoriteQuery } from '@mongodb-js/my-queries-storage';
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
import { OpenBulkUpdateActionButton } from './query-item/query-item-action-buttons';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

type FavoriteActions = {
  onApply: (query: BaseQuery) => void;
  onDelete: (id: string) => void;
  onUpdateFavoriteChoosen: () => void;
};

const FavoriteItem = ({
  query,
  onApply,
  onDelete,
  onUpdateFavoriteChoosen,
}: FavoriteActions & {
  query: FavoriteQuery;
}) => {
  const attributes = useMemo(() => getQueryAttributes(query), [query]);
  const onCardClick = useCallback(() => {
    track('Query History Favorite Used', {
      id: query._id,
      screen: 'documents',
    });
    onUpdateFavoriteChoosen();
    onApply(attributes);
  }, [onApply, onUpdateFavoriteChoosen, query._id, attributes]);

  const isUpdateQuery = useMemo(() => !!query.update, [query]);

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
        <QueryItemHeading title={query._name} isHovered={true}>
          {isHovered && (
            <CopyActionButton
              onClick={() => copyToClipboard(formatQuery(attributes))}
            />
          )}
          {isHovered && <DeleteActionButton onClick={onDeleteClick} />}
          <OpenBulkUpdateActionButton onClick={onCardClick} />
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
  onUpdateFavoriteChoosen,
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
      onUpdateFavoriteChoosen={onUpdateFavoriteChoosen}
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
