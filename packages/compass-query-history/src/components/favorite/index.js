import React, { useMemo } from 'react';
import { listFactory } from '../list';
import FavoriteListItem from './favorite-list-item';
import Saving from '../saving';
import { useFavoriteQueries } from '@mongodb-js/compass-store';

const _FavoriteList = listFactory(FavoriteListItem, Saving);

const FavoriteList = ({ ns, zeroStateTitle }) => {
  const items = useFavoriteQueries(ns.ns);
  const recentItems = useMemo(() => {
    return items
      .sort((a, b) => {
        return (
          b.query._lastExecuted.getTime() - a.query._lastExecuted.getTime()
        );
      })
      .map((item) => item.query);
  }, [items]);

  return (
    <_FavoriteList
      items={recentItems}
      zeroStateTitle={zeroStateTitle}
      ns={ns}
    />
  );
};

export default FavoriteList;
export { FavoriteList, FavoriteListItem };
