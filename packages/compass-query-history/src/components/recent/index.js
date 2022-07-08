import React, { useMemo } from 'react';
import { listFactory } from '../list';
import RecentListItem from './recent-list-item';
import { useRecentQueries } from '@mongodb-js/compass-store';

const _RecentList = listFactory(RecentListItem, null);

const RecentList = ({ ns, zeroStateTitle }) => {
  const items = useRecentQueries(ns.ns);
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
    <_RecentList items={recentItems} zeroStateTitle={zeroStateTitle} ns={ns} />
  );
};

export default RecentList;
export { RecentList, RecentListItem };
