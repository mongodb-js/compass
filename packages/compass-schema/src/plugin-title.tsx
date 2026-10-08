import React from 'react';
import { useTranslation } from '@mongodb-js/compass-components';

export const SchemaTabTitle = () => {
  const t = useTranslation();
  return (
    <div data-testid="schema-tab-title">
      {t('schema.pluginTitle.schema', 'Schema')}
    </div>
  );
};
