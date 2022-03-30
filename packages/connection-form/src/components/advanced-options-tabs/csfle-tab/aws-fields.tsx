import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import type { AutoEncryptionOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';
import KMSTLSOptions from './kms-tls-options';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

type AWSKMSOptions = NonNullable<
  NonNullable<AutoEncryptionOptions['kmsProviders']>['aws']
>;

interface Field {
  name: keyof AWSKMSOptions;
  label: string;
  type: 'password' | 'text';
  optional: boolean;
  value: string;
  errorMessage?: string;
  state: 'error' | 'none';
  description?: string;
}

function AWSFields({
  updateConnectionFormField,
  autoEncryptionOptions,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  autoEncryptionOptions: AutoEncryptionOptions;
}): React.ReactElement {
  const handleFieldChanged = useCallback(
    (key: keyof AWSKMSOptions, value?: string) => {
      return updateConnectionFormField({
        type: 'update-csfle-kms-param',
        kms: 'aws',
        key: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const fields: Field[] = [
    {
      name: 'accessKeyId',
      label: 'Access Key ID',
      type: 'text',
      optional: false,
      value: autoEncryptionOptions?.kmsProviders?.aws?.accessKeyId ?? '',
      state: 'none',
      description: 'The access key used for the AWS KMS provider.'
    },
    {
      name: 'secretAccessKey',
      label: 'Secret Access Key',
      type: 'password',
      optional: false,
      value: autoEncryptionOptions?.kmsProviders?.aws?.secretAccessKey ?? '',
      state: 'none',
      description: 'The secret access key used for the AWS KMS provider.'
    },
    {
      name: 'sessionToken',
      label: 'Session Token',
      type: 'password',
      optional: true,
      value: autoEncryptionOptions?.kmsProviders?.aws?.sessionToken ?? '',
      state: 'none',
      description: 'An optional AWS session token that will be used as the X-Amz-Security-Token header for AWS requests.'
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
        kmsProvider="aws"
        autoEncryptionOptions={autoEncryptionOptions}
        updateConnectionFormField={updateConnectionFormField}
      />
    </>
  );
}

export default AWSFields;
