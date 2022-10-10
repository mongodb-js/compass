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
  KMSProviders,
  KMSOption,
  KMSField,
} from '../../../utils/csfle-kms-fields';
import type { ConnectionFormError } from '../../../utils/validation';
import type { ConnectionOptions } from 'mongodb-data-service';

function KMSProviderFieldsForm<KMSProvider extends keyof KMSProviders>({
  updateConnectionFormField,
  connectionOptions,
  errors,
  kmsProvider,
  fields,
  clientCertIsOptional,
  noTLS,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
  kmsProvider: KMSProvider;
  fields: KMSField<KMSProvider>[];
  clientCertIsOptional?: boolean;
  noTLS?: boolean;
}): React.ReactElement {
  const autoEncryptionOptions =
    connectionOptions.fleOptions?.autoEncryption ?? {};

  const handleFieldChanged = useCallback(
    (key: KMSOption<KMSProvider>, value?: string) => {
      return updateConnectionFormField({
        type: 'update-csfle-kms-param',
        kmsProvider,
        key,
        value,
      });
    },
    [updateConnectionFormField, kmsProvider]
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
                data-testid={`csfle-kms-${kmsProvider}-${name}`}
                label={label}
                type={type === 'textarea' ? undefined : type}
                optional={type === 'textarea' ? undefined : optional}
                value={value(autoEncryptionOptions)}
                errorMessage={errorMessage?.(errors)}
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
          kmsProvider={kmsProvider}
          autoEncryptionOptions={autoEncryptionOptions}
          updateConnectionFormField={updateConnectionFormField}
          clientCertIsOptional={clientCertIsOptional}
        />
      )}
      {kmsProvider === 'local' && (
        <KMSLocalKeyGenerator
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
