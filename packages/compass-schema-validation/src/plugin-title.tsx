import React from 'react';
import { useTranslation } from '@mongodb-js/compass-components';

export function SchemaValidationTabTitle() {
  const t = useTranslation();
  return (
    <div data-testid="validation-tab-title">
      {t('schemaValidation.pluginTitle.validation', 'Validation')}
    </div>
  );
}
