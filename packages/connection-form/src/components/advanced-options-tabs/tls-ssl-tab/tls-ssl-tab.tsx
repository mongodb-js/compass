import React, { useCallback } from 'react';
import {
  Checkbox,
  Description,
  InlineInfoLink,
  Label,
  RadioBox,
  RadioBoxGroup,
  uiColors,
  css,
  cx,
  spacing,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import FormFieldContainer from '../../form-field-container';
import TLSClientCertificate from './tls-client-certificate';
import TLSCertificateAuthority from './tls-certificate-authority';
import type { TLSOptionName, TLS_OPTIONS } from '../../../utils/tls-handler';

const checkboxDescriptionStyles = css({
  marginTop: spacing[1],
});

const disabledCheckboxDescriptionStyles = css({
  color: uiColors.gray.light1,
});

const TLS_TYPES: {
  value: TLS_OPTIONS;
  label: string;
}[] = [
  {
    value: 'DEFAULT',
    label: 'Default',
  },
  {
    value: 'ON',
    label: 'On',
  },
  {
    value: 'OFF',
    label: 'Off',
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

  const onChangeTLS = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateConnectionFormField({
        type: 'update-tls',
        tlsOption: event.target.value as TLS_OPTIONS,
      });
    },
    [updateConnectionFormField]
  );

  const tlsOptionFields: {
    name: TLSOptionName;
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

  const tlsOptionsDisabled = tlsOption === 'OFF';

  const handleTlsOptionChanged = useCallback(
    (key: TLSOptionName, value?: string | null) => {
      return updateConnectionFormField({
        type: 'update-tls-option',
        key,
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
        </Label>
        <InlineInfoLink
          href="https://docs.mongodb.com/manual/reference/connection-string/#tls-options"
          aria-label="TLS/SSL Option Documentation"
        />
        <RadioBoxGroup
          id="connection-schema-radio-box-group"
          value={tlsOption || ''}
          onChange={onChangeTLS}
        >
          {TLS_TYPES.map((tlsType) => (
            <RadioBox
              id={`connection-tls-enabled-${tlsType.value}-radio-button`}
              data-testid={`connection-tls-enabled-${tlsType.value}-radio-button`}
              value={tlsType.value}
              key={tlsType.value}
            >
              {tlsType.label}
            </RadioBox>
          ))}
        </RadioBoxGroup>
      </FormFieldContainer>
      <TLSCertificateAuthority
        connectionStringUrl={connectionStringUrl}
        disabled={tlsOptionsDisabled}
        updateCAFile={(newCertificatePath: string | null) => {
          handleTlsOptionChanged('tlsCAFile', newCertificatePath);
        }}
      />
      <TLSClientCertificate
        connectionStringUrl={connectionStringUrl}
        disabled={tlsOptionsDisabled}
        updateTLSClientCertificate={(newCertificatePath: string | null) => {
          handleTlsOptionChanged('tlsCertificateKeyFile', newCertificatePath);
        }}
        updateTLSClientCertificatePassword={(
          newCertificatePath: string | null
        ) => {
          handleTlsOptionChanged(
            'tlsCertificateKeyFilePassword',
            newCertificatePath
          );
        }}
      />
      {tlsOptionFields.map((tlsOptionField) => (
        <FormFieldContainer key={tlsOptionField.name}>
          <Checkbox
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleTlsOptionChanged(
                tlsOptionField.name,
                event.target.checked ? 'true' : null
              );
            }}
            data-testid={`${tlsOptionField.name}-input`}
            id={`${tlsOptionField.name}-input`}
            label={
              <>
                <Label htmlFor={`${tlsOptionField.name}-input`}>
                  {tlsOptionField.name}
                </Label>
                <Description
                  className={cx(checkboxDescriptionStyles, {
                    [disabledCheckboxDescriptionStyles]: tlsOptionsDisabled,
                  })}
                >
                  {tlsOptionField.description}
                </Description>
              </>
            }
            disabled={tlsOptionsDisabled}
            checked={tlsOptionField.checked}
            bold={false}
          />
        </FormFieldContainer>
      ))}
    </div>
  );
}

export default TLSTab;
