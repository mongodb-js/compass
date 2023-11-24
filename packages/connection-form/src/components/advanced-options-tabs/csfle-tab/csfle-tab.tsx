import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import type { ConnectionOptions } from 'mongodb-data-service';
import {
  Accordion,
  Banner,
  Body,
  Checkbox,
  FormFieldContainer,
  Label,
  Link,
  Description,
  TextInput,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import type { Document, AutoEncryptionOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

import KMSProviderStatusIndicator from './kms-provider-status-indicator';
import KMSProviderFieldsForm from './kms-provider-fields';
import EncryptedFieldConfigInput from './encrypted-field-config-input';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorsByFieldTab,
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import type {
  KMSProviderName,
  KMSField,
} from '../../../utils/csfle-kms-fields';
import { KMSProviderFields } from '../../../utils/csfle-kms-fields';
import { useConnectionFormPreference } from '../../../hooks/use-connect-form-preferences';

const kmsProviderComponentWrapperStyles = css({
  paddingLeft: spacing[3],
  marginBottom: spacing[3],
});

interface KMSProviderMetadata {
  kmsProvider: KMSProviderName;
  title: string;
  noTLS?: boolean;
  clientCertIsOptional?: boolean;
}

const options: KMSProviderMetadata[] = [
  {
    title: 'Local KMS',
    kmsProvider: 'local',
    noTLS: true,
  },
  {
    title: 'AWS',
    kmsProvider: 'aws',
  },
  {
    title: 'GCP',
    kmsProvider: 'gcp',
  },
  {
    title: 'Azure',
    kmsProvider: 'azure',
  },
  {
    title: 'KMIP',
    kmsProvider: 'kmip',
    clientCertIsOptional: false,
  },
];

const containerStyles = css({
  marginTop: spacing[3],
});

const accordionContainerStyles = css({
  marginTop: spacing[3],
});

const titleStyles = css({
  display: 'flex',
  alignItems: 'center',
});

function CSFLETab({
  connectionOptions,
  updateConnectionFormField,
  errors: errors_,
}: {
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const autoEncryptionOptions =
    connectionOptions.fleOptions?.autoEncryption ?? {};

  const enableSchemaMapDebugFlag = useConnectionFormPreference(
    'enableDebugUseCsfleSchemaMap'
  );

  const errors = errorsByFieldTab(errors_, 'csfle');

  const handleFieldChanged = useCallback(
    (
      key: keyof AutoEncryptionOptions,
      value?: AutoEncryptionOptions[keyof AutoEncryptionOptions]
    ) => {
      return updateConnectionFormField({
        type: 'update-csfle-param',
        key: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const handleStoreCredentialsChanged = useCallback(
    (value: boolean) => {
      return updateConnectionFormField({
        type: 'update-csfle-store-credentials',
        value,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <div className={containerStyles}>
      <Banner>
        In-Use Encryption is an Enterprise/Atlas-only feature of MongoDB.&nbsp;
        {/* TODO(COMPASS-5925): Use generic In-Use Encryption URL */}
        <Link href="https://dochub.mongodb.org/core/rqe-encrypted-fields">
          Learn More
        </Link>
      </Banner>
      <FormFieldContainer>
        <TextInput
          onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            handleFieldChanged('keyVaultNamespace', value);
          }}
          name="csfle-keyvault"
          data-testid="csfle-keyvault"
          label="Key Vault Namespace"
          type="text"
          optional={false}
          value={autoEncryptionOptions.keyVaultNamespace || ''}
          errorMessage={errorMessageByFieldName(errors, 'keyVaultNamespace')}
          state={
            fieldNameHasError(errors, 'keyVaultNamespace') ? 'error' : 'none'
          }
          spellCheck={false}
          description="Specify a collection in which data encryption keys are stored in the format <db>.<collection>."
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Body weight="medium">KMS Providers</Body>
        <Description>
          Specify one or more Key Management Systems to use.
        </Description>
      </FormFieldContainer>
      <FormFieldContainer>
        <Checkbox
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            handleStoreCredentialsChanged(event.target.checked);
          }}
          data-testid="csfle-store-credentials-input"
          id="csfle-store-credentials-input"
          label={
            <>
              <Label htmlFor="csfle-store-credentials-input">
                Store KMS provider secrets
              </Label>
              <Description>
                Control whether KMS secrets are stored on disk (protected by the
                OS keychain) or discarded after disconnecting.
              </Description>
            </>
          }
          checked={connectionOptions?.fleOptions?.storeCredentials}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        {options.map(({ title, kmsProvider, ...kmsFieldComponentOptions }) => {
          const accordionTitle = (
            <span className={titleStyles}>
              {title}
              <KMSProviderStatusIndicator
                errors={errors}
                autoEncryptionOptions={autoEncryptionOptions}
                fields={
                  KMSProviderFields[kmsProvider] as KMSField<KMSProviderName>[]
                }
              />
            </span>
          );
          return (
            <div className={accordionContainerStyles} key={kmsProvider}>
              <Accordion
                data-testid={`csfle-kms-provider-${kmsProvider}`}
                text={accordionTitle}
              >
                <div className={kmsProviderComponentWrapperStyles}>
                  <KMSProviderFieldsForm
                    errors={errors}
                    connectionOptions={connectionOptions}
                    updateConnectionFormField={updateConnectionFormField}
                    kmsProvider={kmsProvider}
                    fields={
                      KMSProviderFields[
                        kmsProvider
                      ] as KMSField<KMSProviderName>[]
                    }
                    {...kmsFieldComponentOptions}
                  />
                </div>
              </Accordion>
            </div>
          );
        })}
      </FormFieldContainer>
      <FormFieldContainer>
        <EncryptedFieldConfigInput
          label="EncryptedFieldsMap"
          description="Add an optional client-side EncryptedFieldsMap for enhanced security."
          encryptedFieldsMap={autoEncryptionOptions?.encryptedFieldsMap}
          errorMessage={errorMessageByFieldName(errors, 'encryptedFieldsMap')}
          onChange={(value: Document | undefined) => {
            handleFieldChanged('encryptedFieldsMap', value);
          }}
        />
      </FormFieldContainer>
      {enableSchemaMapDebugFlag && (
        <FormFieldContainer>
          <EncryptedFieldConfigInput
            label="SchemaMap"
            description="Debug: SchemaMap"
            encryptedFieldsMap={autoEncryptionOptions?.schemaMap}
            errorMessage={errorMessageByFieldName(errors, 'schemaMap')}
            onChange={(value: Document | undefined) => {
              handleFieldChanged('schemaMap', value);
            }}
          />
        </FormFieldContainer>
      )}
    </div>
  );
}

export default CSFLETab;
