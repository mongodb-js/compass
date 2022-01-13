import React, { useCallback } from 'react';
import {
  Banner,
  BannerVariant,
  Description,
  Label,
  RadioBox,
  RadioBoxGroup,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import {
  ConnectionFormError,
  SchemaFieldError,
} from '../../../utils/connect-form-errors';
import { MARKABLE_FORM_FIELD_NAMES } from '../../../constants/markable-form-fields';

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
  hideError,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  hideError: (errorIndex: number) => void;
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

  const schemaUpdateErrorIndex = errors.findIndex(
    (error) => error.fieldName === MARKABLE_FORM_FIELD_NAMES.IS_SRV
  );
  const schemaUpdateError = errors[schemaUpdateErrorIndex] as
    | SchemaFieldError
    | undefined;

  return (
    <>
      <Label htmlFor="connection-schema-radio-box-group">Schema</Label>
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
      {schemaUpdateError && (
        <Banner
          variant={BannerVariant.Danger}
          dismissible
          onClose={() => hideError(schemaUpdateErrorIndex)}
        >
          {schemaUpdateError.message}
        </Banner>
      )}
    </>
  );
}

export default SchemaInput;
