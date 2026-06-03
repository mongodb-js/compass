import React, { useCallback, useMemo } from 'react';
import { connect } from '../../stores/context';
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
import type { RootState } from '../../stores/query-bar-store';
import { OpenBulkUpdateActionButton } from './query-item/query-item-action-buttons';
import { usePreference } from 'compass-preferences-model/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

export type FavoriteActions = {
  /**
   * Receives the full FavoriteQuery so the dispatch can forward the
   * favorite's id into the reducer — that's what arms the query bar's
   * `Save` button to update-in-place rather than save as a new copy.
   */
  onApply: (favorite: FavoriteQuery) => void;
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
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const readOnlyCompass = usePreference('readOnly');
  const isUpdateQuery = !!query.update;
  const isDisabled = isUpdateQuery && (isReadonly || readOnlyCompass);
  const attributes = useMemo(() => getQueryAttributes(query), [query]);

  const onCardClick = useCallback(() => {
    track(
      'Query History Favorite Used',
      {
        id: query._id,
        screen: 'documents',
        isUpdateQuery,
      },
      connectionInfoRef.current
    );

    if (isDisabled) {
      return;
    }

    if (isUpdateQuery) {
      onUpdateFavoriteChoosen();
    }

    onApply(query);
  }, [
    track,
    query,
    isUpdateQuery,
    isDisabled,
    onApply,
    onUpdateFavoriteChoosen,
    connectionInfoRef,
  ]);

  const onDeleteClick = useCallback(() => {
    track(
      'Query History Favorite Removed',
      {
        id: query._id,
        screen: 'documents',
        isUpdateQuery,
      },
      connectionInfoRef.current
    );
    onDelete(query._id);
  }, [track, query._id, isUpdateQuery, onDelete, connectionInfoRef]);

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
    // Forward the favorite's id alongside the query body so the
    // reducer can populate `loadedFavoriteId`. Saved queries opened via
    // the slash-command surface (MCP prompts) and via this popover use
    // the same code path.
    onApply: (favorite: FavoriteQuery) =>
      applyFromHistory(getQueryAttributes(favorite), [], {
        favoriteId: favorite._id,
      }),
    onDelete: deleteFavoriteQuery,
  }
)(FavoriteList);
