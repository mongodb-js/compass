import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import type { AutoEncryptionOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';
import KMSTLSOptions from './kms-tls-options';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

type AzureKMSOptions = NonNullable<
  NonNullable<AutoEncryptionOptions['kmsProviders']>['azure']
>;

interface Field {
  name: keyof AzureKMSOptions;
  label: string;
  type: 'password' | 'text';
  optional: boolean;
  value: string;
  errorMessage?: string;
  state: 'error' | 'none';
  description?: string;
}

function AzureFields({
  updateConnectionFormField,
  autoEncryptionOptions,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  autoEncryptionOptions: AutoEncryptionOptions;
}): React.ReactElement {
  const handleFieldChanged = useCallback(
    (key: keyof AzureKMSOptions, value?: string) => {
      return updateConnectionFormField({
        type: 'update-csfle-kms-param',
        kms: 'azure',
        key: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const fields: Field[] = [
    {
      name: 'tenantId',
      label: 'Tenant ID',
      type: 'text',
      optional: false,
      value: autoEncryptionOptions?.kmsProviders?.azure?.tenantId ?? '',
      state: 'none',
      description: 'The tenant ID identifies the organization for the account.'
    },
    {
      name: 'clientId',
      label: 'Client ID',
      type: 'text',
      optional: false,
      value: autoEncryptionOptions?.kmsProviders?.azure?.clientId ?? '',
      state: 'none',
      description: 'The client ID to authenticate a registered application.'
    },
    {
      name: 'clientSecret',
      label: 'Client Secret',
      type: 'password',
      optional: false,
      value: autoEncryptionOptions?.kmsProviders?.azure?.clientSecret ?? '',
      state: 'none',
      description: 'The client secret to authenticate a registered application.'
    },
    {
      name: 'identityPlatformEndpoint',
      label: 'Identity Platform Endpoint',
      type: 'text',
      optional: true,
      value:
        autoEncryptionOptions?.kmsProviders?.azure?.identityPlatformEndpoint ??
        '',
      state: 'none',
      description: 'A host with optional port.'
    },
  ];

  return (
    <>
      {fields.map(
        ({ name, label, type, optional, value, errorMessage, state, description }) => (
          <FormFieldContainer key={name}>
            <TextInput
              onChange={({
                target: { value },
              }: ChangeEvent<HTMLInputElement>) => {
                handleFieldChanged(name, value);
              }}
              name={name}
              data-testid={name}
              label={label}
              type={type}
              optional={optional}
              value={value}
              errorMessage={errorMessage}
              state={state}
              spellCheck={false}
              description={description}
            />
          </FormFieldContainer>
        )
      )}
      <KMSTLSOptions
        kmsProvider="azure"
        autoEncryptionOptions={autoEncryptionOptions}
        updateConnectionFormField={updateConnectionFormField}
      />
    </>
  );
}

export default AzureFields;
