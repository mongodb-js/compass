import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import { TextInput, TextArea } from '@mongodb-js/compass-components';
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
  type: 'password' | 'text' | 'textarea';
  optional: boolean;
  value: string;
  errorMessage?: string;
  state: 'error' | 'none';
  description?: string;
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
      description: 'The service account email to authenticate.'
    },
    {
      name: 'privateKey',
      label: 'Private Key',
      type: 'textarea',
      optional: false,
      value:
        autoEncryptionOptions?.kmsProviders?.gcp?.privateKey?.toString(
          'base64'
        ) ?? '',
      state: 'none',
      description: 'A base64-encoded PKCS#8 private key.'
    },
    {
      name: 'endpoint',
      label: 'Endpoint',
      type: 'text',
      optional: true,
      value: autoEncryptionOptions?.kmsProviders?.gcp?.endpoint ?? '',
      state: 'none',
      description: 'A host with optional port.'
    },
  ];

  return (
    <>
      {fields.map(
        ({ name, label, type, optional, value, errorMessage, state, description }) => {
          const InputComponent = type === 'textarea' ? TextArea : TextInput;
          return (<FormFieldContainer key={name}>
            <InputComponent
              onChange={({
                target: { value },
              }: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
                handleFieldChanged(name, value);
              }}
              name={name}
              data-testid={name}
              label={label}
              type={type === 'textarea' ? undefined : type}
              optional={optional}
              value={value}
              errorMessage={errorMessage}
              state={state}
              spellCheck={false}
              description={description}
            />
          </FormFieldContainer>)
        }
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
