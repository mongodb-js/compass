import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { useFormattedDate } from '@mongodb-js/compass-components';
import {
  deleteRecentQuery,
  saveRecentAsFavorite,
  applyFromHistory,
} from '../../stores/query-bar-reducer';
import type { RootState } from '../../stores/query-bar-store';
import type { RecentQuery } from '@mongodb-js/my-queries-storage';
import { ZeroGraphic } from './zero-graphic';
import {
  QueryItemCard,
  QueryItemContent,
  QueryItemHeading,
  CopyActionButton,
  DeleteActionButton,
  FavoriteActionButton,
} from './query-item';
import { OpenBulkUpdateActionButton } from './query-item/query-item-action-buttons';
import { usePreference } from 'compass-preferences-model';
import { SaveQueryForm } from './save-query-form';
import { formatQuery, copyToClipboard, getQueryAttributes } from '../../utils';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { BaseQuery } from '../../constants/query-properties';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

type RecentActions = {
  onFavorite: (query: RecentQuery, name: string) => Promise<boolean>;
  onDelete: (id: string) => void;
  onApply: (query: BaseQuery) => void;
  onUpdateRecentChoosen: () => void;
};

const RecentItem = ({
  query,
  isReadonly,
  onFavorite,
  onDelete,
  onApply,
  onUpdateRecentChoosen,
}: RecentActions & {
  query: RecentQuery;
  isReadonly: boolean;
}) => {
  const readOnlyCompass = usePreference('readOnly', React);
  const isUpdateQuery = !!query.update;
  const isDisabled = isUpdateQuery && (isReadonly || readOnlyCompass);

  const formRef = React.useRef<HTMLFormElement>(null);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const attributes = useMemo(() => getQueryAttributes(query), [query]);
  const title = useFormattedDate(query._lastExecuted.getTime());

  const onClickRecent = useCallback(() => {
    if (isDisabled) {
      return;
    }

    if (isUpdateQuery) {
      onUpdateRecentChoosen();
    }

    track('Query History Recent Used', {
      isUpdateQuery,
    });
    onApply(attributes);
  }, [isDisabled, isUpdateQuery, onApply, attributes, onUpdateRecentChoosen]);

  const onCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // If the click event originates from the form, ignore.
      if (formRef.current?.contains(event.target as HTMLElement)) {
        return;
      }

      onClickRecent();
    },
    [onClickRecent]
  );

  const onSaveQuery = useCallback(
    (name: string) => {
      track('Query History Favorite Added', { isUpdateQuery });
      void onFavorite(query, name);
    },
    [query, onFavorite, isUpdateQuery]
  );

  return (
    <QueryItemCard
      onClick={onCardClick}
      disabled={isDisabled}
      data-testid="recent-query-list-item"
      header={(isHovered: boolean) => {
        if (isAddingFavorite) {
          return (
            <SaveQueryForm
              ref={formRef}
              onSave={onSaveQuery}
              onCancel={() => setIsAddingFavorite(false)}
            />
          );
        }
        return (
          <QueryItemHeading title={title} isHovered={isHovered}>
            <FavoriteActionButton onClick={() => setIsAddingFavorite(true)} />
            <CopyActionButton
              onClick={() => copyToClipboard(formatQuery(attributes))}
            />
            <DeleteActionButton onClick={() => onDelete(query._id)} />
            {isUpdateQuery && !isReadonly && !readOnlyCompass && (
              <OpenBulkUpdateActionButton onClick={onClickRecent} />
            )}
          </QueryItemHeading>
        );
      }}
    >
      <QueryItemContent query={attributes} />
    </QueryItemCard>
  );
};

export const RecentList = ({
  queries,
  onDelete,
  onFavorite: _onFavorite,
  onApply,
  onSaveFavorite,
  onUpdateRecentChoosen,
  isReadonly,
}: RecentActions & {
  queries: RecentQuery[];
  onSaveFavorite: () => void;
  isReadonly: boolean;
}) => {
  const onFavorite = useCallback(
    async (query: RecentQuery, name: string) => {
      const saved = await _onFavorite(query, name);
      if (saved) {
        onSaveFavorite();
      }
      return saved;
    },
    [_onFavorite, onSaveFavorite]
  );

  if (queries.length === 0) {
    return <ZeroGraphic text={'Your recent queries will appear here.'} />;
  }
  const content = queries.map((query) => (
    <RecentItem
      key={query._id}
      query={query}
      onApply={onApply}
      onFavorite={onFavorite}
      onDelete={onDelete}
      onUpdateRecentChoosen={onUpdateRecentChoosen}
      isReadonly={isReadonly}
    />
  ));
  return <>{content}</>;
};

export default connect(
  ({ queryBar: { recentQueries, isReadonlyConnection } }: RootState) => ({
    queries: recentQueries,
    isReadonly: isReadonlyConnection,
  }),
  {
    onDelete: deleteRecentQuery,
    onFavorite: saveRecentAsFavorite,
    onApply: applyFromHistory,
  }
)(RecentList);
