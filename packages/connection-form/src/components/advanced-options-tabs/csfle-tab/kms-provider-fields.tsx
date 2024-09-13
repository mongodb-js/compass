import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import {
  FormFieldContainer,
  TextInput,
  TextArea,
} from '@mongodb-js/compass-components';

import KMSTLSOptions from './kms-tls-options';
import KMSLocalKeyGenerator from './kms-local-key-generator';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type {
  KMSProviderType,
  KMSProviderName,
  KMSOption,
  KMSField,
  KMSTLSProviderName,
} from '../../../utils/csfle-kms-fields';
import type { ConnectionFormError } from '../../../utils/validation';
import type { ConnectionOptions } from 'mongodb-data-service';

function KMSProviderFieldsForm<T extends KMSProviderType>({
  updateConnectionFormField,
  connectionOptions,
  errors,
  kmsProviderType,
  kmsProviderName,
  fields,
  clientCertIsOptional,
  noTLS,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
  kmsProviderType: T;
  kmsProviderName: KMSProviderName<T>;
  fields: KMSField<T>[];
  clientCertIsOptional?: boolean;
  noTLS?: boolean;
}): React.ReactElement {
  const autoEncryptionOptions =
    connectionOptions.fleOptions?.autoEncryption ?? {};

  const handleFieldChanged = useCallback(
    (key: KMSOption<T>, value?: string) => {
      return updateConnectionFormField({
        type: 'update-csfle-kms-param',
        kmsProviderName,
        key,
        value,
      });
    },
    [updateConnectionFormField, kmsProviderName]
  );

  return (
    <>
      {fields.map(
        ({
          name,
          label,
          type,
          optional,
          value,
          errorMessage,
          state,
          description,
        }) => {
          const InputComponent = type === 'textarea' ? TextArea : TextInput;
          return (
            <FormFieldContainer key={name}>
              <InputComponent
                onChange={({
                  target: { value },
                }:
                  | ChangeEvent<HTMLInputElement>
                  | ChangeEvent<HTMLTextAreaElement>) => {
                  handleFieldChanged(name, value);
                }}
                name={name}
                data-testid={`csfle-kms-${kmsProviderType}-${name}`}
                label={label}
                type={type === 'textarea' ? undefined : type}
                optional={type === 'textarea' ? undefined : optional}
                value={value(autoEncryptionOptions, kmsProviderName)}
                errorMessage={errorMessage?.(errors, kmsProviderName)}
                state={typeof state === 'string' ? state : state(errors)}
                spellCheck={false}
                description={description}
              />
            </FormFieldContainer>
          );
        }
      )}
      {!noTLS && (
        <KMSTLSOptions
          kmsProviderName={kmsProviderName as KMSTLSProviderName<T>}
          autoEncryptionOptions={autoEncryptionOptions}
          updateConnectionFormField={updateConnectionFormField}
          clientCertIsOptional={clientCertIsOptional}
        />
      )}
      {kmsProviderType === 'local' && (
        <KMSLocalKeyGenerator
          kmsProviderName={kmsProviderName as KMSProviderName<'local'>}
          connectionOptions={connectionOptions}
          handleFieldChanged={
            handleFieldChanged as (
              key: KMSOption<'local'>,
              value?: string
            ) => void
          }
        />
      )}
    </>
  );
}

export default KMSProviderFieldsForm;
