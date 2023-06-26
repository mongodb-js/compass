import React, { useCallback } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

import { Toolbar } from './toolbar/toolbar';
import RecentList from './recent-list';
import FavoriteList from './favorite-list';

import { connect } from 'react-redux';
import {
  type QueryBarState,
  fetchFavorites,
  fetchRecents,
} from '../../stores/query-bar-reducer';
import { useTrackOnChange } from '@mongodb-js/compass-logging';

const containerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '388px',
  maxHeight: '100%',
});

const contentStyles = css({
  overflowY: 'auto',
  padding: spacing[3],
  paddingTop: 0,
});

export type SavedQueryTab = 'recent' | 'favorite';

type QueryHistoryProps = {
  namespace: string;
  onSelectRecent: () => void;
  onSelectFavorite: () => void;
};

const QueryHistory = ({
  namespace,
  onSelectRecent,
  onSelectFavorite,
}: QueryHistoryProps) => {
  const [tab, setTab] = React.useState<SavedQueryTab>('recent');

  const onSelectTab = useCallback(
    (newTab: SavedQueryTab) => {
      setTab(newTab);
      if (newTab === 'recent') {
        onSelectRecent();
      } else {
        onSelectFavorite();
      }
    },
    [onSelectRecent, onSelectFavorite]
  );

  useTrackOnChange(
    'COMPASS-QUERY-BAR-UI',
    (track) => {
      if (tab === 'favorite') {
        track('Query History Favorites');
      } else {
        track('Query History Recent');
      }
    },
    [tab],
    undefined,
    React
  );

  return (
    <div data-testid="query-history" className={containerStyle}>
      <Toolbar tab={tab} onChange={onSelectTab} namespace={namespace} />
      <div className={contentStyles}>
        {tab === 'recent' && <RecentList />}
        {tab === 'favorite' && <FavoriteList />}
      </div>
    </div>
  );
};

export default connect(
  ({ namespace }: QueryBarState) => ({
    namespace,
  }),
  {
    onSelectRecent: fetchRecents,
    onSelectFavorite: fetchFavorites,
  }
)(QueryHistory);
