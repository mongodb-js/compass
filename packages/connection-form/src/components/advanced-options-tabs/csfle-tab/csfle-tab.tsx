import type { ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';
import type { ConnectionOptions } from 'mongodb-data-service';
import {
  Label,
  TextInput,
  spacing,
  css,
  cx,
} from '@mongodb-js/compass-components';
import type { Document, AutoEncryptionOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

import LocalFields from './local-fields';
import AWSFields from './aws-fields';
import GCPFields from './gcp-fields';
import AzureFields from './azure-fields';
import KMIPFields from './kmip-fields';
import EncryptedFieldConfigInput from './encrypted-field-config-input';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorsByFieldTab,
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import FormFieldContainer from '../../form-field-container';

const kmsToggleLabelStyles = css({
  '&:hover': {
    cursor: 'pointer',
  },
});

const buttonReset = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
});

const faIcon = css({
  width: spacing[3],
  height: spacing[3],
  padding: '2px',
  textAlign: 'center',
});

const kmsProviderComponentWrapperStyles = css({
  paddingLeft: spacing[3],
  marginBottom: spacing[3]
});

type KMSProviderName = keyof NonNullable<AutoEncryptionOptions['kmsProviders']>;
interface KMSFields {
  id: KMSProviderName;
  title: string;
  component: React.FC<{
    autoEncryptionOptions: AutoEncryptionOptions;
    updateConnectionFormField: UpdateConnectionFormField;
    errors: ConnectionFormError[];
  }>;
}

const options: KMSFields[] = [
  {
    title: 'Local KMS',
    id: 'local',
    component: LocalFields,
  },
  {
    title: 'AWS',
    id: 'aws',
    component: AWSFields,
  },
  {
    title: 'GCP',
    id: 'gcp',
    component: GCPFields,
  },
  {
    title: 'Azure',
    id: 'azure',
    component: AzureFields,
  },
  {
    title: 'KMIP',
    id: 'kmip',
    component: KMIPFields,
  },
];

const containerStyles = css({
  marginTop: spacing[3],
});

function CSFLETab({
  connectionOptions,
  updateConnectionFormField,
  errors,
}: {
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const [expandedKMSProviders, setExpandedKMSProviders] = useState<
    KMSProviderName[]
  >([]);
  const autoEncryptionOptions =
    connectionOptions.fleOptions?.autoEncryption ?? {};

  errors = errorsByFieldTab(errors, 'csfle');

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
      <Label htmlFor="TODO">KMS Providers</Label>
      {options.map(({ title, id, component: KMSProviderComponent }) => {
        const isExpanded = expandedKMSProviders.includes(id);
        return (
          <div key={id}>
            <div>
              <button
                className={buttonReset}
                id={`toggle-kms-${id}`}
                aria-labelledby={`toggle-kms-${id}-label`}
                aria-pressed={expandedKMSProviders.includes(id)}
                aria-label={
                  isExpanded ? 'Collapse field items' : 'Expand field items'
                }
                type="button"
                onClick={(evt) => {
                  console.log(evt.target)
                  evt.stopPropagation();
                  evt.preventDefault();
                  if (isExpanded) {
                    setExpandedKMSProviders(
                      expandedKMSProviders.filter((i) => i !== id)
                    );
                  } else {
                    setExpandedKMSProviders([...expandedKMSProviders, id]);
                  }
                }}
              >
                <span
                  role="presentation"
                  className={cx(
                    faIcon,
                    `fa fa-angle-right ${isExpanded ? 'fa-rotate-90' : ''}`
                  )}
                ></span>
              </button>
              <Label
                className={kmsToggleLabelStyles}
                id={`toggle-kms-${id}-label`}
                htmlFor={`toggle-kms-${id}`}
              >
                {title}
              </Label>
            </div>
            {isExpanded && (
              <div className={kmsProviderComponentWrapperStyles}>
                <KMSProviderComponent
                  errors={errors}
                  autoEncryptionOptions={autoEncryptionOptions}
                  updateConnectionFormField={updateConnectionFormField}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CSFLETab;
