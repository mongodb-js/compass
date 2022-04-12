import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import { TextInput, TextArea } from '@mongodb-js/compass-components';
import type { AutoEncryptionOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';
import KMSTLSOptions from './kms-tls-options';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type {
  KMSProviders,
  KMSOption,
  KMSField,
} from '../../../utils/csfle-kms-fields';
import type { ConnectionFormError } from '../../../utils/validation';

function KMSProviderFieldsForm<KMSProvider extends keyof KMSProviders>({
  updateConnectionFormField,
  autoEncryptionOptions,
  errors,
  kmsProvider,
  fields,
  clientCertIsOptional,
  noTLS,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  autoEncryptionOptions: AutoEncryptionOptions;
  errors: ConnectionFormError[];
  kmsProvider: KMSProvider;
  fields: KMSField<KMSProvider>[];
  clientCertIsOptional?: boolean;
  noTLS?: boolean;
}): React.ReactElement {
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
                data-testid={name}
                label={label}
                type={type === 'textarea' ? undefined : type}
                optional={optional}
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
    </>
  );
}

export default KMSProviderFieldsForm;
