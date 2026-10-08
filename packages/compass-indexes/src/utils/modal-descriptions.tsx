import React from 'react';
import type { TranslateFn } from '@mongodb-js/compass-components';

export const hideModalDescription = (indexName: string, t: TranslateFn) => (
  <>
    {t('indexes.hideModal.before', 'The index `')}
    <b>{indexName}</b>
    {t(
      'indexes.hideModal.after',
      '` will no longer be visible to the query planner and cannot be used to support a query. If the impact is negative, you can unhide this index.'
    )}
  </>
);

export const unhideModalDescription = (indexName: string, t: TranslateFn) => (
  <>
    {t('indexes.unhideModal.before', 'The index `')}
    <b>{indexName}</b>
    {t(
      'indexes.unhideModal.after',
      '` will become visible to the query planner and can be used to support a query. If the impact is negative, you can hide this index.'
    )}
  </>
);
