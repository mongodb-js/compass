import React, { useState } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

import { Toolbar } from './toolbar/toolbar';
import RecentList from './recent-list';
import FavoriteList from './favorite-list';

import { connect } from '../../stores/context';
import type { RootState } from '../../stores/query-bar-store';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

const containerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '388px',
  maxHeight: '100%',
});

const contentStyles = css({
  overflowY: 'auto',
  padding: spacing[400],
  paddingTop: 0,
});

export type QueryHistoryTab = 'recent' | 'favorite';

type QueryHistoryProps = {
  namespace: string;
  onUpdateFavoriteChoosen: () => void;
  onUpdateRecentChoosen: () => void;
};

const QueryHistory = ({
  namespace,
  onUpdateFavoriteChoosen,
  onUpdateRecentChoosen,
}: QueryHistoryProps) => {
  const [tab, setTab] = useState<QueryHistoryTab>('recent');
  const connectionInfoRef = useConnectionInfoRef();

  useTrackOnChange(
    (track: TrackFunction) => {
      const connectionInfo = connectionInfoRef.current;
      if (tab === 'favorite') {
        track('Query History Favorites', {}, connectionInfo);
      } else {
        track('Query History Recent', {}, connectionInfo);
      }
    },
    [tab, connectionInfoRef],
    undefined
  );

  return (
    <div data-testid="query-history" className={containerStyle}>
      <Toolbar tab={tab} onChange={setTab} namespace={namespace} />
      <div className={contentStyles}>
        {tab === 'recent' && (
          <RecentList
            onUpdateRecentChoosen={onUpdateRecentChoosen}
            onSaveFavorite={() => setTab('favorite')}
          />
        )}
        {tab === 'favorite' && (
          <FavoriteList onUpdateFavoriteChoosen={onUpdateFavoriteChoosen} />
        )}
      </div>
    </div>
  );
};

export default connect(({ queryBar: { namespace } }: RootState) => ({
  namespace,
}))(QueryHistory);
