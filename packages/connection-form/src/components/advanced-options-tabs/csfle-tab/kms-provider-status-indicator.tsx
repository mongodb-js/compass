import React from 'react';
import type { AutoEncryptionOptions } from 'mongodb';

import type { KMSProviders, KMSField } from '../../../utils/csfle-kms-fields';
import type { ConnectionFormError } from '../../../utils/validation';
import { css, Icon, spacing, palette } from '@mongodb-js/compass-components';

const iconStyles = css({
  marginLeft: spacing[2],
  display: 'block',
});

function KMSProviderStatusIndicator<KMSProvider extends keyof KMSProviders>({
  autoEncryptionOptions,
  errors,
  fields,
}: {
  autoEncryptionOptions: AutoEncryptionOptions;
  errors: ConnectionFormError[];
  fields: KMSField<KMSProvider>[];
}): React.ReactElement {
  const hasAnyFieldSet = fields.some(({ value }) =>
    value(autoEncryptionOptions)
  );
  const isMissingRequiredField = fields.some(
    ({ value, optional }) => !optional && !value(autoEncryptionOptions)
  );
  const hasFieldWithError = fields.some(
    ({ state }) =>
      (typeof state === 'string' ? state : state(errors)) === 'error'
  );

  if (hasFieldWithError) {
    return (
      <span title="Error">
        <Icon
          glyph="XWithCircle"
          className={iconStyles}
          style={{ color: palette.red.base }}
        />
      </span>
    );
  } else if (hasAnyFieldSet && isMissingRequiredField) {
    return (
      <span title="Incomplete configuration">
        <Icon glyph="QuestionMarkWithCircle" className={iconStyles} />
      </span>
    );
  } else if (hasAnyFieldSet) {
    return (
      <span title="Fully configured">
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
