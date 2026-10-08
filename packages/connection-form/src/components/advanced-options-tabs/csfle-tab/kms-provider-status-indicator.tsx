import React from 'react';
import type { AutoEncryptionOptions } from 'mongodb';

import type {
  KMSField,
  KMSProviderName,
  KMSProviderType,
} from '../../../utils/csfle-kms-fields';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  css,
  Icon,
  spacing,
  palette,
  useTranslation,
} from '@mongodb-js/compass-components';

const iconStyles = css({
  marginLeft: spacing[200],
  display: 'block',
});

function KMSProviderStatusIndicator<T extends KMSProviderType>({
  autoEncryptionOptions,
  errors,
  kmsProviders,
  fields,
}: {
  autoEncryptionOptions: AutoEncryptionOptions;
  errors: ConnectionFormError[];
  fields: KMSField<T>[];
  kmsProviders: KMSProviderName<T>[];
}): React.ReactElement {
  const t = useTranslation();
  const hasAnyFieldSet = kmsProviders.some((kmsProviderName) =>
    fields.some(({ value }) => value(autoEncryptionOptions, kmsProviderName))
  );
  const isMissingRequiredField = kmsProviders.some((kmsProviderName) =>
    fields.some(
      ({ value, optional }) =>
        !optional && !value(autoEncryptionOptions, kmsProviderName)
    )
  );
  const hasFieldWithError = kmsProviders.some(() =>
    fields.some(
      ({ state }) =>
        (typeof state === 'string' ? state : state(errors)) === 'error'
    )
  );

  if (hasFieldWithError) {
    return (
      <span title={t('connections.form.csfle.statusError', 'Error')}>
        <Icon
          glyph="XWithCircle"
          className={iconStyles}
          style={{ color: palette.red.base }}
        />
      </span>
    );
  } else if (hasAnyFieldSet && isMissingRequiredField) {
    return (
      <span
        title={t(
          'connections.form.csfle.statusIncomplete',
          'Incomplete configuration'
        )}
      >
        <Icon glyph="QuestionMarkWithCircle" className={iconStyles} />
      </span>
    );
  } else if (hasAnyFieldSet) {
    return (
      <span
        title={t('connections.form.csfle.statusConfigured', 'Fully configured')}
      >
        <Icon
          glyph="CheckmarkWithCircle"
          className={iconStyles}
          style={{ color: palette.green.dark1 }}
        />
      </span>
    );
  }
  return <></>;
}

export default KMSProviderStatusIndicator;
