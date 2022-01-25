import React, { useCallback } from 'react';
import {
  Checkbox,
  Description,
  Icon,
  IconButton,
  Label,
  RadioBox,
  RadioBoxGroup,
  spacing,
  uiColors,
  css,
  cx,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import TLSClientCertificate from './tls-client-certificate';
import TLSCertificateAuthority from './tls-certificate-authority';
import { TLS_OPTIONS } from '../../../utils/tls-options';

const tlsDescriptionStyles = css({
  marginTop: spacing[1],
});

const infoButtonStyles = css({
  verticalAlign: 'middle',
  marginTop: -spacing[2],
  marginBottom: -spacing[2],
});

const disabledCheckboxDescriptionStyles = css({
  color: uiColors.gray.light1,
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

  const tlsOptionFields: {
    name: keyof MongoClientOptions;
    description: string;
    checked: boolean;
  }[] = [
    {
      name: 'tlsInsecure',
      description:
        'This includes tlsAllowInvalidHostnames and tlsAllowInvalidCertificates.',
      checked: connectionStringUrl.searchParams.get('tlsInsecure') === 'true',
    },
    {
      name: 'tlsAllowInvalidHostnames',
      description:
        'Disable the validation of the hostnames in the certificate presented by the mongod/mongos instance.',
      checked:
        connectionStringUrl.searchParams.get('tlsAllowInvalidHostnames') ===
        'true',
    },
    {
      name: 'tlsAllowInvalidCertificates',
      description: 'Disable the validation of the server certificates.',
      checked:
        connectionStringUrl.searchParams.get('tlsAllowInvalidCertificates') ===
        'true',
    },
  ];

  const tlsOptionsDisabled = tlsOption !== 'ON';

  const handleFieldChanged = useCallback(
    (key: keyof MongoClientOptions, value?: string | null) => {
      if (!value) {
        return updateConnectionFormField({
          type: 'delete-search-param',
          key,
        });
      }
      return updateConnectionFormField({
        type: 'update-search-param',
        currentKey: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <div>
      <FormFieldContainer>
        <Label htmlFor="connection-schema-radio-box-group">
          SSL/TLS Connection
          <IconButton
            className={infoButtonStyles}
            aria-label="TLS/SSL Option Documentation"
            href="https://docs.mongodb.com/manual/reference/connection-string/#tls-options"
            target="_blank"
          >
            <Icon glyph="InfoWithCircle" size="small" />
          </IconButton>
        </Label>
        <RadioBoxGroup value={tlsOption || ''} onChange={onChangeTLSOption}>
          {TLS_TYPES.map((tlsType) => (
            <RadioBox value={tlsType.value} key={tlsType.value}>
              {tlsType.label}
            </RadioBox>
          ))}
        </RadioBoxGroup>
        <Description className={tlsDescriptionStyles}>
          {TLS_TYPES.find((tlsType) => tlsType.value === tlsOption)
            ?.description || ''}
        </Description>
      </FormFieldContainer>
      <TLSCertificateAuthority
        connectionStringUrl={connectionStringUrl}
        disabled={tlsOptionsDisabled}
        updateCAFile={(newCertificatePath: string | null) => {
          handleFieldChanged('tlsCAFile', newCertificatePath);
        }}
      />
      <TLSClientCertificate
        connectionStringUrl={connectionStringUrl}
        disabled={tlsOptionsDisabled}
        updateTLSClientCertificate={(newCertificatePath: string | null) => {
          handleFieldChanged('tlsCertificateKeyFile', newCertificatePath);
        }}
        updateTLSClientCertificatePassword={(
          newCertificatePath: string | null
        ) => {
          handleFieldChanged(
            'tlsCertificateKeyFilePassword',
            newCertificatePath
          );
        }}
      />
      {tlsOptionFields.map((tlsOptionField) => (
        <FormFieldContainer key={tlsOptionField.name}>
          <Checkbox
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleFieldChanged(
                tlsOptionField.name,
                event.target.checked ? 'true' : 'false'
              );
            }}
            data-testid={`${tlsOptionField.name}-input`}
            label={tlsOptionField.name}
            disabled={tlsOptionsDisabled}
            checked={tlsOptionField.checked}
            bold={false}
          />
          <Description
            className={cx({
              [disabledCheckboxDescriptionStyles]: tlsOptionsDisabled,
            })}
          >
            {tlsOptionField.description}
          </Description>
        </FormFieldContainer>
      ))}
    </div>
  );
}

export default TLSTab;
