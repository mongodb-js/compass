import React from 'react';
import { useTranslation } from 'react-i18next';

export function SchemaValidationTabTitle() {
  const { t } = useTranslation('compassSchemaValidation');
  return <div data-testid="validation-tab-title">{t('tabName')}</div>;
}
