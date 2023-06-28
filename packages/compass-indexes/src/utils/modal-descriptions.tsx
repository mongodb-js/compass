import React from 'react';

export const hideModalDescription = (indexName: string) => (
  <>
    The index `<b>{indexName}</b>` will no longer be visible to the query
    planner and cannot be used to support a query. If the impact is negative,
    you can unhide this index.
  </>
);

export const unhideModalDescription = (indexName: string) => (
  <>
    The index `<b>{indexName}</b>` will become visible to the query planner and
    can be used to support a query. If the impact is negative, you can hide this
    index.
  </>
);
