import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import type { ConnectionOptions } from 'mongodb-data-service';
import {
  Accordion,
  Banner,
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
import FormFieldContainer from '../../form-field-container';

const withMarginStyles = css({
  marginTop: spacing[1],
});

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

  return (
    <div className={containerStyles}>
      <Banner>
        Client-side Field-Level Encryption is an Enterprise/Atlas-only feature
        of MongoDB.&nbsp;
        <Link href="https://www.mongodb.com/docs/drivers/security/client-side-field-level-encryption-guide/">
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
      <EncryptedFieldConfigInput
        // TODO(COMPASS-5645): This says 'schemaMap', which is the
        // FLE1 equivalent of the FLE2 'encryptedFieldConfig[Map?]'.
        // Once 'encryptedFieldConfig' is available, we will start
        // using it instead.
        encryptedFieldConfig={autoEncryptionOptions?.schemaMap}
        errorMessage={errorMessageByFieldName(errors, 'schemaMap')}
        onChange={(value: Document | undefined) => {
          handleFieldChanged('schemaMap', value);
        }}
      />
      <div className={withMarginStyles}>
        <Label htmlFor="TODO(COMPASS-5653)">KMS Providers</Label>
      </div>
      <div className={withMarginStyles}>
        <Description>
          Specify one or more Key Management Systems to use.
        </Description>
      </div>
      {options.map(({ title, kmsProvider, ...kmsFieldComponentOptions }) => {
        const accordionTitle = (
          <span>
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
          <Accordion key={kmsProvider} text={accordionTitle}>
            <div className={kmsProviderComponentWrapperStyles}>
              <KMSProviderFieldsForm
                errors={errors}
                autoEncryptionOptions={autoEncryptionOptions}
                updateConnectionFormField={updateConnectionFormField}
                kmsProvider={kmsProvider}
                fields={
                  KMSProviderFields[kmsProvider] as KMSField<KMSProviderName>[]
                }
                {...kmsFieldComponentOptions}
              />
            </div>
          </Accordion>
        );
      })}
    </div>
  );
}

export default CSFLETab;
