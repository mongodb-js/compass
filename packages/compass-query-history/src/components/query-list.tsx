import React from 'react';
import { connect } from 'react-redux';
import { spacing, css } from '@mongodb-js/compass-components';

import { ZeroGraphic } from './zero-graphic';
import type { AmpersandModelType } from '../models/query';
import type { RootState } from '../modules/query-history';
import RecentListItem from './recent-list-item';
import FavoriteListItem from './favorite-list-item';
import type { AmpersandCollectionType } from '../models/recent-query-collection';

const componentStyles = css({
  overflowY: 'auto',
  padding: spacing[3],
  paddingTop: 0,
});

type QueryListProps = {
  items: AmpersandCollectionType<AmpersandModelType<any>>;
  //  // TODO: ampersand collection types?
  // current: null | any; // TODO: null or query? do we need this??
  ns: string;

  renderQueryItem: React.FunctionComponent<{
    model: AmpersandModelType<any>;
  }>;
};

function QueryList({
  items,
  current = null, // TODO: Can we remove defaults?
  ns = '',
  renderQueryItem,
}: QueryListProps) {
  const renderItems = items
    .filter((item) => item._ns === ns)
    .map((item, index) =>
      React.createElement(renderQueryItem, {
        key: index + 1,
        model: item,
      })
    );

  const renderZeroState = renderItems.length === 0 && current === null;

  return (
    <div className={componentStyles}>
      {renderZeroState ? <ZeroGraphic /> : <div>{renderItems}</div>}
    </div>
  );
}

export const FavoriteQueriesList = connect(
  ({ queryHistory: { ns }, favoriteQueries: { items } }: RootState) => {
    return {
      ns: ns.ns,
      items,
      renderQueryItem: FavoriteListItem,
    };
  },
  null
)(QueryList);
export const RecentQueriesList = connect(
  ({ queryHistory: { ns }, recentQueries: { items } }: RootState) => {
    return {
      ns: ns.ns,
      items,
      renderQueryItem: RecentListItem,
    };
  },
  null
)(QueryList);
