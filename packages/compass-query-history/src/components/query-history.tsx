import React from 'react';
import { css } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

// Components
import QueryHistoryToolbar from './toolbar';
import { queryListFactory } from './query-list';
// TODO: These files?
import { RecentListItem } from './recent-list-item';
import { FavoriteListItem } from './favorite-list-item';
import type { RootState } from '../modules/query-history';

const componentStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '388px',
  maxHeight: '100%',
});

const RecentList = queryListFactory(RecentListItem);
const FavoriteList = queryListFactory(FavoriteListItem);

function QueryHistory({ showing }: { showing: 'recent' | 'favorites' }) {
  return (
    <div data-testid="query-history" className={componentStyle}>
      <QueryHistoryToolbar />

      {showing === 'favorites' && (
        <FavoriteList data-testid="query-history-list-favorites" />
      )}
      {showing === 'recent' && (
        <RecentList data-testid="query-history-list-recent" />
      )}
    </div>
  );
}

export { QueryHistory };
export default connect(({ queryHistory: { ns, showing } }: RootState) => {
  return {
    showing,
    ns,
  };
}, null)(QueryHistory);
