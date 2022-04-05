import React from 'react';
import type { AutoEncryptionOptions } from 'mongodb';

import type { KMSProviders, KMSField } from '../../../utils/csfle-kms-fields';
import type { ConnectionFormError } from '../../../utils/validation';

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

  // TODO(COMPASS-5651): Use actual icons here
  if (hasFieldWithError) {
    return <span>[Error]</span>;
  } else if (hasAnyFieldSet && isMissingRequiredField) {
    return <span>[Incomplete]</span>;
  } else if (hasAnyFieldSet) {
    return <span>[Configured]</span>;
  }
  return <></>;
}

export default KMSProviderStatusIndicator;
