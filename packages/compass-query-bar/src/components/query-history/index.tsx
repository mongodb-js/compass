import React, { useCallback } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

import { Toolbar } from './toolbar/toolbar';
import RecentList from './recent-list';
import FavoriteList from './favorite-list';

import { connect } from 'react-redux';
import {
  type QueryBarState,
  type QueryHistoryTab,
  changeQueryHistoryTab,
} from '../../stores/query-bar-reducer';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

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

type QueryHistoryProps = {
  tab: QueryHistoryTab;
  namespace: string;
  onChangeTab: (tab: QueryHistoryTab) => void;
};

const QueryHistory = ({ tab, namespace, onChangeTab }: QueryHistoryProps) => {
  const onChange = useCallback(
    (newTab: QueryHistoryTab) => {
      if (newTab === 'favorite') {
        track('Query History Favorites');
      } else {
        track('Query History Recent');
      }
      onChangeTab(newTab);
    },
    [onChangeTab]
  );

  return (
    <div data-testid="query-history" className={containerStyle}>
      <Toolbar tab={tab} onChange={onChange} namespace={namespace} />
      <div className={contentStyles}>
        {tab === 'recent' && <RecentList />}
        {tab === 'favorite' && <FavoriteList />}
      </div>
    </div>
  );
};

export default connect(
  ({ namespace, activeTab }: QueryBarState) => ({
    namespace,
    tab: activeTab,
  }),
  {
    onChangeTab: changeQueryHistoryTab,
  }
)(QueryHistory);
