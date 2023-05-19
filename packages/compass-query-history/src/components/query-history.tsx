import React from 'react';
import mongodbns from 'mongodb-ns';
import { css } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

// Components
import QueryHistoryToolbar from './toolbar';
// TODO: These files?
import { RecentList } from './recent-list-item';
import { FavoriteList } from './favorite-list-item';
import type { RootState } from '../modules/query-history';

const componentStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '388px',
  maxHeight: '100%',
});

function QueryHistory({
  showing
}: {
  showing: 'recent' | 'favorites';
}) {
  return (
    <div data-testid="query-history" className={componentStyle}>
      <QueryHistoryToolbar />

      {showing === 'favorites' && (
        <FavoriteList
          data-testid="query-history-list-favorites"
        />
      )}
      {showing === 'recent' && (
        <RecentList
          data-testid="query-history-list-recent"
        />
      )}
    </div>
  );
}


export { QueryHistory };
export default connect(
  ({
    queryHistory: {
      ns,
      showing
    }
  }: RootState) => {
    return {
      showing,
      ns
    };
  },
  {
    // TODO: actions
  }
)(QueryHistory)
