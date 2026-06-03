import React, { useCallback, useMemo } from 'react';
import { connect } from '../../stores/context';
import { useFormattedDate } from '@mongodb-js/compass-components';
import {
  deleteRecentQuery,
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
} from './query-item';
import { OpenBulkUpdateActionButton } from './query-item/query-item-action-buttons';
import { usePreference } from 'compass-preferences-model/provider';
import { formatQuery, copyToClipboard, getQueryAttributes } from '../../utils';
import type { BaseQuery } from '../../constants/query-properties';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

// NOTE: the inline "favorite this recent" star was removed when the
// query bar grew a dedicated Save-as-favorite IconButton (next to
// Apply). The star inside the recents popover was buried — most users
// never found it — and the dedicated dialog captures richer metadata
// (description, MCP prompt name). To save a recent query as a favorite
// now, click it to load the query into the bar, then click the star.

type RecentActions = {
  onDelete: (id: string) => void;
  onApply: (query: BaseQuery) => void;
  onUpdateRecentChoosen: () => void;
};

const RecentItem = ({
  query,
  isReadonly,
  onDelete,
  onApply,
  onUpdateRecentChoosen,
}: RecentActions & {
  query: RecentQuery;
  isReadonly: boolean;
}) => {
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  const readOnlyCompass = usePreference('readOnly');
  const isUpdateQuery = !!query.update;
  const isDisabled = isUpdateQuery && (isReadonly || readOnlyCompass);

  const attributes = useMemo(() => getQueryAttributes(query), [query]);
  const title = useFormattedDate(query._lastExecuted.getTime());

  const onClickRecent = useCallback(() => {
    if (isDisabled) {
      return;
    }

    if (isUpdateQuery) {
      onUpdateRecentChoosen();
    }

    track(
      'Query History Recent Used',
      {
        isUpdateQuery,
      },
      connectionInfoRef.current
    );
    onApply(attributes);
  }, [
    isDisabled,
    isUpdateQuery,
    track,
    onApply,
    attributes,
    onUpdateRecentChoosen,
    connectionInfoRef,
  ]);

  return (
    <QueryItemCard
      onClick={onClickRecent}
      disabled={isDisabled}
      data-testid="recent-query-list-item"
      header={(isHovered: boolean) => {
        return (
          <QueryItemHeading title={title} isHovered={isHovered}>
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
  onApply,
  onUpdateRecentChoosen,
  isReadonly,
}: RecentActions & {
  queries: RecentQuery[];
  isReadonly: boolean;
}) => {
  if (queries.length === 0) {
    return <ZeroGraphic text={'Your recent queries will appear here.'} />;
  }
  const content = queries.map((query) => (
    <RecentItem
      key={query._id}
      query={query}
      onApply={onApply}
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
    onApply: applyFromHistory,
  }
)(RecentList);
