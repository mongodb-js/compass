import React from 'react';
import { useTranslation } from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';

export const TranslationConsumer: React.FunctionComponent<{
  children: (t: TranslateFn) => React.ReactNode;
}> = ({ children }) => {
  const t = useTranslation();
  return <>{children(t)}</>;
};
