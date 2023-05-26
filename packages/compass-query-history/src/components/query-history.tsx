import React from 'react';
import { css } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import QueryHistoryToolbar from './toolbar';
import { FavoriteQueriesList, RecentQueriesList } from './query-list';
import type { RootState } from '../modules/query-history';

const componentStyle = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  width: '388px',
  maxHeight: '100%',
});

function QueryHistory({ showing }: { showing: 'recent' | 'favorites' }) {
  return (
    <div data-testid="query-history" className={componentStyle}>
      <QueryHistoryToolbar />

      {showing === 'favorites' && <FavoriteQueriesList />}
      {showing === 'recent' && <RecentQueriesList />}
    </div>
  );
}

export { QueryHistory };
export default connect(({ queryHistory: { showing } }: RootState) => {
  return {
    showing,
  };
}, null)(QueryHistory);
