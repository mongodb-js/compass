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
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

type LocalKMSOptions = NonNullable<
  NonNullable<AutoEncryptionOptions['kmsProviders']>['local']
>;

interface Field {
  name: keyof LocalKMSOptions;
  label: string;
  type: 'password' | 'text';
  optional: boolean;
  value: string;
  errorMessage?: string;
  state: 'error' | 'none';
  description?: string;
}

function LocalFields({
  updateConnectionFormField,
  errors,
  autoEncryptionOptions,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  errors: ConnectionFormError[];
  autoEncryptionOptions: AutoEncryptionOptions;
}): React.ReactElement {
  const handleFieldChanged = useCallback(
    (key: keyof LocalKMSOptions, value?: string) => {
      return updateConnectionFormField({
        type: 'update-csfle-kms-param',
        kms: 'local',
        key: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const fields: Field[] = [
    {
      name: 'key',
      label: 'Key',
      type: 'text',
      optional: false,
      value:
        autoEncryptionOptions?.kmsProviders?.local?.key?.toString('base64') ??
        '',
      errorMessage: errorMessageByFieldName(errors, 'local.key'),
      state: fieldNameHasError(errors, 'local.key') ? 'error' : 'none',
      description: 'A 96-byte long base64-encoded string.'
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
    </>
  );
}

export default LocalFields;
