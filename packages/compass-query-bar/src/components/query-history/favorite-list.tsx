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
import { usePreference } from 'compass-preferences-model';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

export type FavoriteActions = {
  onApply: (query: BaseQuery) => void;
  onDelete: (id: string) => void;
  onUpdateFavoriteChoosen: () => void;
};

const FavoriteItem = ({
  query,
  isReadonly,
  onApply,
  onDelete,
  onUpdateFavoriteChoosen,
}: FavoriteActions & {
  query: FavoriteQuery;
  isReadonly: boolean;
}) => {
  const readOnlyCompass = usePreference('readOnly', React);
  const isUpdateQuery = !!query.update;
  const isDisabled = isUpdateQuery && (isReadonly || readOnlyCompass);
  const attributes = useMemo(() => getQueryAttributes(query), [query]);

  const onCardClick = useCallback(() => {
    track('Query History Favorite Used', {
      id: query._id,
      screen: 'documents',
      isUpdateQuery,
    });

    if (isDisabled) {
      return;
    }

    if (isUpdateQuery) {
      onUpdateFavoriteChoosen();
    }

    onApply(attributes);
  }, [
    onApply,
    onUpdateFavoriteChoosen,
    query._id,
    attributes,
    isUpdateQuery,
    isDisabled,
  ]);

  const onDeleteClick = useCallback(() => {
    track('Query History Favorite Removed', {
      id: query._id,
      screen: 'documents',
      isUpdateQuery,
    });
    onDelete(query._id);
  }, [onDelete, query._id, isUpdateQuery]);

  return (
    <QueryItemCard
      key={query._id}
      disabled={isDisabled}
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
          {isUpdateQuery && !isReadonly && !readOnlyCompass && (
            <OpenBulkUpdateActionButton onClick={onCardClick} />
          )}
        </QueryItemHeading>
      )}
    >
      <QueryItemContent query={attributes} />
    </QueryItemCard>
  );
};

export const FavoriteList = ({
  queries,
  isReadonly,
  onApply,
  onDelete,
  onUpdateFavoriteChoosen,
}: FavoriteActions & {
  queries: FavoriteQuery[];
  isReadonly: boolean;
}) => {
  if (queries.length === 0) {
    return <ZeroGraphic text={'Your favorite queries will appear here.'} />;
  }
  const content = queries.map((query) => (
    <FavoriteItem
      key={query._id}
      query={query}
      isReadonly={isReadonly}
      onApply={onApply}
      onDelete={onDelete}
      onUpdateFavoriteChoosen={onUpdateFavoriteChoosen}
    />
  ));
  return <>{content}</>;
};

export default connect(
  ({ queryBar: { favoriteQueries, isReadonlyConnection } }: RootState) => ({
    queries: favoriteQueries,
    isReadonly: isReadonlyConnection,
  }),
  {
    onApply: applyFromHistory,
    onDelete: deleteFavoriteQuery,
  }
)(FavoriteList);
