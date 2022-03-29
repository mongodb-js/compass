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
import type { AutoEncryptionOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

import LocalFields from './local-fields';
import AWSFields from './aws-fields';
import GCPFields from './gcp-fields';
import AzureFields from './azure-fields';
import KMIPFields from './kmip-fields';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorsByFieldTab,
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import FormFieldContainer from '../../form-field-container';

const kmsToggleStyles = css({
  height: 14,
  width: 26,
  margin: 0,
  marginLeft: spacing[1],
});

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

const contentStyles = css({
  marginTop: spacing[3],
  width: '50%',
  minWidth: 400,
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
  const [enabledKMSProviders, setEnabledKMSProviders] = useState<
    KMSProviderName[]
  >([]);
  const autoEncryptionOptions =
    connectionOptions.fleOptions?.autoEncryption ?? {};

  errors = errorsByFieldTab(errors, 'csfle');

  const handleFieldChanged = useCallback(
    (key: keyof AutoEncryptionOptions, value?: string) => {
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
        />
      </FormFieldContainer>
      {/* TODO: Add Ace editor for EncryptedFieldConfig/SchemaMap */}
      <Label htmlFor="TODO">KMS Providers</Label>
      {options.map(({ title, id, component: KMSProviderComponent }) => {
        const isExpanded = enabledKMSProviders.includes(id);
        return (
          <div key={id}>
            <div>
              <button
                className={buttonReset}
                id={`toggle-kms-${id}`}
                aria-labelledby={`toggle-kms-${id}-label`}
                aria-pressed={enabledKMSProviders.includes(id)}
                aria-label={
                  isExpanded ? 'Collapse field items' : 'Expand field items'
                }
                onClick={(evt) => {
                  evt.stopPropagation();
                  evt.preventDefault();
                  if (isExpanded) {
                    setEnabledKMSProviders(
                      enabledKMSProviders.filter((i) => i !== id)
                    );
                  } else {
                    setEnabledKMSProviders([...enabledKMSProviders, id]);
                  }
                }}
              >
                <span role="presentation" className={cx(faIcon, `fa fa-angle-right ${isExpanded ? 'fa-rotate-90' : ''}`)}
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
              <KMSProviderComponent
                errors={errors}
                autoEncryptionOptions={autoEncryptionOptions}
                updateConnectionFormField={updateConnectionFormField}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CSFLETab;
