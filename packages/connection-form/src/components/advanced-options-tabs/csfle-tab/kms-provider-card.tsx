import React, { useCallback, useState, type ChangeEvent } from 'react';
import {
  Card,
  css,
  Icon,
  IconButton,
  spacing,
  TextInput,
  useHoverState,
} from '@mongodb-js/compass-components';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type {
  KMSField,
  KMSProviderType,
  KMSProviderName,
} from '../../../utils/csfle-kms-fields';
import type { ConnectionFormError } from '../../../utils/validation';
import type { ConnectionOptions } from 'mongodb-data-service';
import KMSProviderFieldsForm from './kms-provider-fields';

const cardStyles = css({
  marginTop: spacing[200],
  marginBottom: spacing[200],
});

const flexContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const pushRightStyles = css({
  marginLeft: 'auto',
});

type KMSProviderCardProps<T extends KMSProviderType> = {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
  kmsProviderType: T;
  kmsProviderNames: KMSProviderName<T>[];
  fields: KMSField<T>[];
  clientCertIsOptional?: boolean;
  noTLS?: boolean;
  kmsProviderName: KMSProviderName<T>;
  index: number;
};

function KMSProviderCard<T extends KMSProviderType>({
  kmsProviderName,
  kmsProviderNames,
  updateConnectionFormField,
  connectionOptions,
  errors,
  kmsProviderType,
  fields,
  clientCertIsOptional,
  noTLS,
  index,
}: KMSProviderCardProps<T>) {
  const [hoverProps, isHovered] = useHoverState();
  const [cardName, setCardName] = useState(kmsProviderName);
  const [nameError, setNameError] = useState<string | undefined>();

  const onRenameKmsProvider = useCallback(
    (name: string) => {
      const newName = `${kmsProviderType}:${name}` as KMSProviderName<T>;
      setCardName(newName);
      if (name === '') {
        setNameError('Name cannot be empty');
        return;
      }
      // If the newName is already taken, we show error and do not rename.
      if (kmsProviderNames.includes(newName) && kmsProviderName !== newName) {
        setNameError('Name already exists');
        return;
      }
      setNameError(undefined);
      return updateConnectionFormField({
        type: 'rename-csfle-kms-provider',
        name: kmsProviderName,
        newName,
      });
    },
    [
      kmsProviderType,
      kmsProviderNames,
      kmsProviderName,
      updateConnectionFormField,
    ]
  );
  const onRemoveKmsProvider = useCallback(() => {
    return updateConnectionFormField({
      type: 'remove-csfle-kms-provider',
      name: kmsProviderName,
    });
  }, [updateConnectionFormField, kmsProviderName]);

  return (
    <Card
      data-card-index={index}
      data-testid={`${kmsProviderName}-kms-card-item`}
      className={cardStyles}
      {...hoverProps}
    >
      <div data-testid="kms-card-header" className={flexContainerStyles}>
        <TextInput
          spellCheck={false}
          onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            onRenameKmsProvider(value);
          }}
          data-testid="csfle-kms-card-name"
          label={'KMS Name'}
          type={'text'}
          optional={false}
          state={nameError ? 'error' : 'none'}
          errorMessage={nameError}
          // Do not show the prefix to the user and as such it can not be edited.
          value={cardName.replace(`${kmsProviderType}:`, '')}
        />
        {kmsProviderNames.length > 1 && isHovered && (
          <IconButton
            aria-label="Remove KMS provider"
            className={pushRightStyles}
            onClick={onRemoveKmsProvider}
          >
            <Icon glyph="Trash" />
          </IconButton>
        )}
      </div>
      <KMSProviderFieldsForm
        key={kmsProviderName}
        errors={errors}
        connectionOptions={connectionOptions}
        updateConnectionFormField={updateConnectionFormField}
        kmsProviderType={kmsProviderType}
        kmsProviderName={kmsProviderName}
        fields={fields}
        clientCertIsOptional={clientCertIsOptional}
        noTLS={noTLS}
      />
    </Card>
  );
}

export default KMSProviderCard;
