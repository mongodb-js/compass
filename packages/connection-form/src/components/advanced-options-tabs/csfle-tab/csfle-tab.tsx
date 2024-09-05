import type { ChangeEvent } from 'react';
import React, { useCallback, useMemo } from 'react';
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
import KMSProviderContent, {
  getNextKmsProviderName,
} from './kms-provider-content';
import EncryptedFieldConfigInput from './encrypted-field-config-input';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorsByFieldTab,
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import type {
  KMSProviderType,
  KMSField,
  KMSProviderName,
} from '../../../utils/csfle-kms-fields';
import { KMSProviderFields } from '../../../utils/csfle-kms-fields';
import { useConnectionFormPreference } from '../../../hooks/use-connect-form-preferences';

const kmsProviderComponentWrapperStyles = css({
  paddingLeft: spacing[3],
  marginBottom: spacing[3],
});

interface KMSProviderMetadata {
  kmsProviderType: KMSProviderType;
  title: string;
  noTLS?: boolean;
  clientCertIsOptional?: boolean;
}

const options: KMSProviderMetadata[] = [
  {
    title: 'Local KMS',
    kmsProviderType: 'local',
    noTLS: true,
  },
  {
    title: 'AWS',
    kmsProviderType: 'aws',
  },
  {
    title: 'GCP',
    kmsProviderType: 'gcp',
  },
  {
    title: 'Azure',
    kmsProviderType: 'azure',
  },
  {
    title: 'KMIP',
    kmsProviderType: 'kmip',
    clientCertIsOptional: false,
  },
];

const accordionContainerStyles = css({
  marginTop: spacing[3],
});

const titleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[50],
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
        key,
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

  const onOpenAccordion = useCallback(
    (kmsProviderType: KMSProviderType, isOpen: boolean) => {
      const hasExistingKmsType = Object.keys(
        connectionOptions.fleOptions?.autoEncryption?.kmsProviders ?? {}
      ).some((kmsProvider) => kmsProvider.match(kmsProviderType));
      // When we are expanding an accordion the first time, we should add a new empty KMS provider
      // in the connection form state if there is none.
      if (isOpen && !hasExistingKmsType) {
        return updateConnectionFormField({
          type: 'add-new-csfle-kms-provider',
          name: getNextKmsProviderName(kmsProviderType),
        });
      }
    },
    [
      updateConnectionFormField,
      connectionOptions.fleOptions?.autoEncryption?.kmsProviders,
    ]
  );

  const kmsProviders = useMemo(() => {
    return Object.keys(
      connectionOptions.fleOptions?.autoEncryption?.kmsProviders ?? {}
    ).reduce((acc, kmsProvider) => {
      const type = kmsProvider.split(':')[0] as KMSProviderType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type]!.push(kmsProvider as KMSProviderName<KMSProviderType>);
      return acc;
    }, {} as Partial<Record<KMSProviderType, KMSProviderName<KMSProviderType>[]>>);
  }, [connectionOptions.fleOptions?.autoEncryption?.kmsProviders]);

  return (
    <>
      <FormFieldContainer>
        <Banner>
          In-Use Encryption is an Enterprise/Atlas-only feature of
          MongoDB.&nbsp;
          {/* TODO(COMPASS-5925): Use generic In-Use Encryption URL */}
          <Link href="https://dochub.mongodb.org/core/rqe-encrypted-fields">
            Learn More
          </Link>
        </Banner>
      </FormFieldContainer>

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
        {options.map(
          ({ title, kmsProviderType, ...kmsFieldComponentOptions }) => {
            const accordionTitle = (
              <span className={titleStyles}>
                {title}
                {(kmsProviders[kmsProviderType]?.length ?? 0) > 1 && (
                  <span>({kmsProviders[kmsProviderType]?.length})</span>
                )}
                <KMSProviderStatusIndicator
                  errors={errors}
                  autoEncryptionOptions={autoEncryptionOptions}
                  kmsProviders={kmsProviders[kmsProviderType] ?? []}
                  fields={
                    KMSProviderFields[
                      kmsProviderType
                    ] as KMSField<KMSProviderType>[]
                  }
                />
              </span>
            );
            return (
              <div className={accordionContainerStyles} key={kmsProviderType}>
                <Accordion
                  setOpen={(open) => onOpenAccordion(kmsProviderType, open)}
                  data-testid={`csfle-kms-provider-${kmsProviderType}`}
                  text={accordionTitle}
                >
                  <div className={kmsProviderComponentWrapperStyles}>
                    <KMSProviderContent
                      errors={errors}
                      connectionOptions={connectionOptions}
                      updateConnectionFormField={updateConnectionFormField}
                      kmsProviderType={kmsProviderType}
                      fields={
                        KMSProviderFields[
                          kmsProviderType
                        ] as KMSField<KMSProviderType>[]
                      }
                      kmsProviderNames={kmsProviders[kmsProviderType] ?? []}
                      {...kmsFieldComponentOptions}
                    />
                  </div>
                </Accordion>
              </div>
            );
          }
        )}
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
    </>
  );
}

export default CSFLETab;
