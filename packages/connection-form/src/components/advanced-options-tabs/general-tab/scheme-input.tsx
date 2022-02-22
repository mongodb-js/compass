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

enum MONGODB_SCHEMA {
  MONGODB = 'MONGODB',
  MONGODB_SRV = 'MONGODB_SRV',
}

const descriptionStyles = css({
  marginTop: spacing[1],
});

const regularSchemaDescription =
  'Standard Connection String Format. The standard format of the MongoDB connection URI is used to connect to a MongoDB deployment: standalone, replica set, or a sharded cluster.';
const srvSchemaDescription =
  'DNS Seed List Connection Format. The +srv indicates to the client that the hostname that follows corresponds to a DNS SRV record.';

function SchemaInput({
  connectionStringUrl,
  errors,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const { isSRV } = connectionStringUrl;

  const onChangeConnectionSchema = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-connection-schema',
        isSrv: event.target.value === MONGODB_SCHEMA.MONGODB_SRV,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <>
      <Label htmlFor="connection-schema-radio-box-group">
        Connection String Scheme
      </Label>
      <RadioBoxGroup
        id="connection-schema-radio-box-group"
        value={isSRV ? MONGODB_SCHEMA.MONGODB_SRV : MONGODB_SCHEMA.MONGODB}
        onChange={onChangeConnectionSchema}
      >
        <RadioBox value={MONGODB_SCHEMA.MONGODB}>mongodb</RadioBox>
        <RadioBox value={MONGODB_SCHEMA.MONGODB_SRV}>mongodb+srv</RadioBox>
      </RadioBoxGroup>
      <Description className={descriptionStyles}>
        {isSRV ? srvSchemaDescription : regularSchemaDescription}
      </Description>
      {fieldNameHasError(errors, 'isSrv') && (
        <Banner variant={BannerVariant.Danger}>
          {errorMessageByFieldName(errors, 'isSrv')}
        </Banner>
      )}
    </>
  );
}

export default SchemaInput;
