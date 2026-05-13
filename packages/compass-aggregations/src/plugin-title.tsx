import React from 'react';
import { useTranslation } from 'react-i18next';

export function AggregationsTabTitle() {
  const { t } = useTranslation('compassAggregations');
  return <div data-testid="aggregations-tab-title">{t('tabName')}</div>;
}
