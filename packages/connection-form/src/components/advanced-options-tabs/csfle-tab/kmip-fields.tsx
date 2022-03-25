import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import type { AutoEncryptionOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import KMSTLSOptions from './kms-tls-options';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

type KMIPOptions = NonNullable<
  NonNullable<AutoEncryptionOptions['kmsProviders']>['kmip']
>;

interface Field {
  name: keyof KMIPOptions;
  label: string;
  type: 'password' | 'text';
  optional: boolean;
  value: string;
  errorMessage?: string;
  state: 'error' | 'none';
}

function KMIPFIelds({
  updateConnectionFormField,
  errors,
  autoEncryptionOptions,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  errors: ConnectionFormError[];
  autoEncryptionOptions: AutoEncryptionOptions;
}): React.ReactElement {
  const handleFieldChanged = useCallback(
    (key: keyof KMIPOptions, value?: string) => {
      return updateConnectionFormField({
        type: 'update-csfle-kms-param',
        kms: 'kmip',
        key: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const fields: Field[] = [
    {
      name: 'endpoint',
      label: 'Endpoint',
      type: 'text',
      optional: false,
      value: autoEncryptionOptions?.kmsProviders?.kmip?.endpoint ?? '',
      errorMessage: errorMessageByFieldName(errors, 'kmip.endpoint'),
      state: fieldNameHasError(errors, 'kmip.endpoint') ? 'error' : 'none',
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
        kmsProvider="kmip"
        autoEncryptionOptions={autoEncryptionOptions}
        updateConnectionFormField={updateConnectionFormField}
      />
    </>
  );
}

export default KMIPFIelds;
