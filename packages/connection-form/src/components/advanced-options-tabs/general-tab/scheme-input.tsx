import React, { useCallback } from 'react';
import {
  Banner,
  BannerVariant,
  Description,
  RadioBox,
  RadioBoxGroup,
  Label,
  spacing,
  css,
  useTranslation,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';

const MONGODB_SCHEME = {
  MONGODB: 'MONGODB',
  MONGODB_SRV: 'MONGODB_SRV',
} as const;

const descriptionStyles = css({
  marginTop: spacing[200],
});

function SchemeInput({
  connectionStringUrl,
  errors,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const t = useTranslation();
  const { isSRV } = connectionStringUrl;

  const onChangeConnectionScheme = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-connection-scheme',
        isSrv: event.target.value === String(MONGODB_SCHEME.MONGODB_SRV),
      });
    },
    [updateConnectionFormField]
  );

  return (
    <>
      <Label htmlFor="connection-scheme-radio-box-group">
        {t('connections.form.general.scheme', 'Connection String Scheme')}
      </Label>
      <RadioBoxGroup
        id="connection-scheme-radio-box-group"
        value={isSRV ? MONGODB_SCHEME.MONGODB_SRV : MONGODB_SCHEME.MONGODB}
        onChange={onChangeConnectionScheme}
      >
        <RadioBox
          id="connection-scheme-mongodb-radiobox"
          data-testid="connection-scheme-mongodb-radiobox"
          value={MONGODB_SCHEME.MONGODB}
        >
          mongodb
        </RadioBox>
        <RadioBox
          id="connection-scheme-srv-radiobox"
          data-testid="connection-scheme-srv-radiobox"
          value={MONGODB_SCHEME.MONGODB_SRV}
        >
          mongodb+srv
        </RadioBox>
      </RadioBoxGroup>
      <Description className={descriptionStyles}>
        {isSRV
          ? t(
              'connections.form.general.srvSchemeDescription',
              'DNS Seed List Connection Format. The +srv indicates to the client that the hostname that follows corresponds to a DNS SRV record.'
            )
          : t(
              'connections.form.general.regularSchemeDescription',
              'Standard Connection String Format. The standard format of the MongoDB connection URI is used to connect to a MongoDB deployment: standalone, replica set, or a sharded cluster.'
            )}
      </Description>
      {fieldNameHasError(errors, 'isSrv') && (
        <Banner variant={BannerVariant.Danger}>
          {errorMessageByFieldName(errors, 'isSrv')}
        </Banner>
      )}
    </>
  );
}

export default SchemeInput;
