import React, { useCallback } from 'react';
import {
  Description,
  Label,
  RadioBox,
  RadioBoxGroup,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import { TLS_OPTIONS } from '../../../utils/tls-options';

const descriptionStyles = css({
  marginTop: spacing[1],
});

const TLS_TYPES: {
  value: TLS_OPTIONS;
  label: string;
  description: string;
}[] = [
  {
    value: 'DEFAULT',
    label: 'Default',
    description:
      'Default (unset) – TLS/SSL will be used when connecting using a DNS Seed List Connection Format (mongodb+srv://) and it will not be used when connecting using a standard connection string schema format (mongodb://).',
  },
  {
    value: 'ON',
    label: 'On',
    description: 'On – TLS/SSL is enabled for this connection.',
  },
  {
    value: 'OFF',
    label: 'Off',
    description: 'Off – TLS/SSL is disabled for this connection.',
  },
];

export function getTLSOptionForConnectionString(
  connectionStringUrl: ConnectionStringUrl
): TLS_OPTIONS | undefined {
  const searchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();
  if (searchParams.get('ssl') === null && searchParams.get('tls') === null) {
    return 'DEFAULT';
  }

  if (
    searchParams.get('tls') === 'true' &&
    (searchParams.get('ssl') === null || searchParams.get('ssl') === 'true')
  ) {
    return 'ON';
  }

  if (
    searchParams.get('tls') === 'false' &&
    (searchParams.get('ssl') === null || searchParams.get('ssl') === 'false')
  ) {
    return 'OFF';
  }

  if (searchParams.get('ssl') === 'true' && searchParams.get('tls') === null) {
    return 'ON';
  }

  if (searchParams.get('ssl') === 'false' && searchParams.get('tls') === null) {
    return 'OFF';
  }

  // When the TLS/SSL options are a mismatching pair or not `true` or `false`
  // we return undefined, as we can't map it to one of our three settings,
  // although it may somehow be a valid configuration.
}

function TLSTab({
  connectionStringUrl,
  updateConnectionFormField,
}: {
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const tlsOption = getTLSOptionForConnectionString(connectionStringUrl);

  const onChangeTLSOption = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-tls-option',
        tlsOption: event.target.value as TLS_OPTIONS,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <div>
      <FormFieldContainer>
        <Label htmlFor="connection-schema-radio-box-group">
          SSL/TLS Connection
        </Label>
        <RadioBoxGroup value={tlsOption || ''} onChange={onChangeTLSOption}>
          {TLS_TYPES.map((tlsType) => (
            <RadioBox value={tlsType.value} key={tlsType.value}>
              {tlsType.label}
            </RadioBox>
          ))}
        </RadioBoxGroup>
        <Description className={descriptionStyles}>
          {TLS_TYPES.find((tlsType) => tlsType.value === tlsOption)
            ?.description || ''}
        </Description>
      </FormFieldContainer>
    </div>
  );
}

export default TLSTab;
