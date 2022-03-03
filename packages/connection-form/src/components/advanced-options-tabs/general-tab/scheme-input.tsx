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
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';

enum MONGODB_SCHEME {
  MONGODB = 'MONGODB',
  MONGODB_SRV = 'MONGODB_SRV',
}

const descriptionStyles = css({
  marginTop: spacing[2],
});

const regularSchemeDescription =
  'Standard Connection String Format. The standard format of the MongoDB connection URI is used to connect to a MongoDB deployment: standalone, replica set, or a sharded cluster.';
const srvSchemeDescription =
  'DNS Seed List Connection Format. The +srv indicates to the client that the hostname that follows corresponds to a DNS SRV record.';

function SchemeInput({
  connectionStringUrl,
  errors,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const { isSRV } = connectionStringUrl;

  const onChangeConnectionScheme = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-connection-scheme',
        isSrv: event.target.value === MONGODB_SCHEME.MONGODB_SRV,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <>
      <Label htmlFor="connection-scheme-radio-box-group">
        Connection String Scheme
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
        {isSRV ? srvSchemeDescription : regularSchemeDescription}
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
