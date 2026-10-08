import { useTranslation } from '@mongodb-js/compass-components';
import React from 'react';

export function AggregationsTabTitle() {
  const t = useTranslation();
  return (
    <div data-testid="aggregations-tab-title">
      {t('aggregations.tabTitle', 'Aggregations')}
    </div>
  );
}
