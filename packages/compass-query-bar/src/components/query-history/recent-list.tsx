import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { useFormattedDate } from '@mongodb-js/compass-components';
import {
  type QueryBarState,
  deleteRecentQuery,
  saveRecentAsFavorite,
  applyFromHistory,
} from '../../stores/query-bar-reducer';
import type { RecentQuery } from '../../utils/query-storage';
import { ZeroGraphic } from './zero-graphic';
import {
  QueryItemCard,
  QueryItemContent,
  QueryItemHeading,
  CopyActionButton,
  DeleteActionButton,
  FavoriteActionButton,
} from './query-item';
import { SaveQueryForm } from './save-query-form';
import { formatQuery, copyToClipboard, getQueryAttributes } from '../../utils';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { BaseQuery } from '../../constants/query-properties';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

type RecentActions = {
  onFavorite: (query: RecentQuery, name: string) => void;
  onDelete: (id: string) => void;
  onApply: (query: BaseQuery) => void;
};

const RecentItem = ({
  query,
  onFavorite,
  onDelete,
  onApply,
}: RecentActions & {
  query: RecentQuery;
}) => {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const attributes = useMemo(() => getQueryAttributes(query), [query]);
  const title = useFormattedDate(query._lastExecuted.getTime());

  const onCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // If the click event originates from the form, ignore.
      if (formRef.current?.contains(event.target as HTMLElement)) {
        return;
      }
      track('Query History Recent Used');
      onApply(attributes);
    },
    [onApply, attributes]
  );

  const onSaveQuery = useCallback(
    (name: string) => {
      track('Query History Favorite Added');
      onFavorite(query, name);
    },
    [query, onFavorite]
  );

  return (
    <QueryItemCard
      onClick={onCardClick}
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
          </QueryItemHeading>
        );
      }}
    >
      <QueryItemContent query={attributes} />
    </QueryItemCard>
  );
};

const RecentList = ({
  queries,
  onDelete,
  onFavorite,
  onApply,
}: RecentActions & {
  queries: RecentQuery[];
}) => {
  if (queries.length === 0) {
    return <ZeroGraphic />;
  }
  const content = queries.map((query) => (
    <RecentItem
      key={query._id}
      query={query}
      onApply={onApply}
      onFavorite={onFavorite}
      onDelete={onDelete}
    />
  ));
  return <>{content}</>;
};

export default connect(
  ({ recentQueries }: QueryBarState) => ({
    queries: recentQueries,
  }),
  {
    onDelete: deleteRecentQuery,
    onFavorite: saveRecentAsFavorite,
    onApply: applyFromHistory,
  }
)(RecentList);
