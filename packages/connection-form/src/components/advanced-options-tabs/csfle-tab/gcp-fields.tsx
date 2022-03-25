import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import type { AutoEncryptionOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';
import KMSTLSOptions from './kms-tls-options';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

type GCPKMSOptions = NonNullable<
  NonNullable<AutoEncryptionOptions['kmsProviders']>['gcp']
>;

interface Field {
  name: keyof GCPKMSOptions;
  label: string;
  type: 'password' | 'text';
  optional: boolean;
  value: string;
  errorMessage?: string;
  state: 'error' | 'none';
}

function GCPFields({
  updateConnectionFormField,
  autoEncryptionOptions,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  autoEncryptionOptions: AutoEncryptionOptions;
}): React.ReactElement {
  const handleFieldChanged = useCallback(
    (key: keyof GCPKMSOptions, value?: string) => {
      return updateConnectionFormField({
        type: 'update-csfle-kms-param',
        kms: 'gcp',
        key: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const fields: Field[] = [
    {
      name: 'email',
      label: 'Service Account E-Mail',
      type: 'text',
      optional: false,
      value: autoEncryptionOptions?.kmsProviders?.gcp?.email ?? '',
      state: 'none',
    },
    {
      name: 'privateKey',
      label: 'Private Key',
      type: 'password',
      optional: false,
      value:
        autoEncryptionOptions?.kmsProviders?.gcp?.privateKey?.toString(
          'base64'
        ) ?? '',
      state: 'none',
    },
    {
      name: 'endpoint',
      label: 'Endpoint',
      type: 'text',
      optional: true,
      value: autoEncryptionOptions?.kmsProviders?.gcp?.endpoint ?? '',
      state: 'none',
    },
  ];

  return (
    <>
      {fields.map(
        ({ name, label, type, optional, value, errorMessage, state }) => (
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
            />
          </FormFieldContainer>
        )
      )}
      <KMSTLSOptions
        kmsProvider="gcp"
        autoEncryptionOptions={autoEncryptionOptions}
        updateConnectionFormField={updateConnectionFormField}
      />
    </>
  );
}

export default GCPFields;
