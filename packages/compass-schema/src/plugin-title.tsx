import React from 'react';
import { useTranslation } from 'react-i18next';

export const SchemaTabTitle = () => {
  const { t } = useTranslation('compassSchema');
  return <div data-testid="schema-tab-title">{t('tabName')}</div>;
};
