import React, { useCallback, useState, type ChangeEvent } from 'react';
import {
  Card,
  css,
  Icon,
  IconButton,
  spacing,
  TextInput,
  useHoverState,
  Body,
  Label,
  cx,
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
  gap: spacing[100],
});

// With these margins, when clicking edit button, there is no flickering.
const editKmsContainerStyles = css({
  marginTop: spacing[100],
  marginBottom: spacing[100],
});

const pushRightStyles = css({
  marginLeft: 'auto',
});

function KMSNameComponent<T extends KMSProviderType>({
  kmsProviderName,
  kmsProviderType,
  validateName,
  onRename,
}: {
  kmsProviderName: KMSProviderName<T>;
  kmsProviderType: T;
  validateName: (name: string) => string | undefined;
  onRename: (newName: KMSProviderName<T>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [name, setName] = useState(() => {
    return kmsProviderName.replace(new RegExp(`^${kmsProviderType}:?`), '');
  });

  const onEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const onChangeName = useCallback(
    (newName: string) => {
      setName(newName);
      setValidationError(validateName(newName));
    },
    [setValidationError, validateName]
  );

  const onSave = useCallback(() => {
    if (validationError) {
      return;
    }
    setIsEditing(false);
    onRename(name === '' ? kmsProviderType : `${kmsProviderType}:${name}`);
  }, [kmsProviderType, name, onRename, validationError]);

  if (!isEditing) {
    return (
      <div>
        <Label htmlFor="kms-name">KMS Name</Label>
        <div className={cx(flexContainerStyles, editKmsContainerStyles)}>
          <Body>{kmsProviderName}</Body>
          <IconButton
            data-testid="csfle-edit-kms-name"
            aria-label="Edit KMS provider name"
            onClick={onEdit}
          >
            <Icon glyph="Edit" />
          </IconButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={kmsProviderName}>KMS Name</Label>
      <div className={flexContainerStyles}>
        <Body>{kmsProviderType}:</Body>
        <TextInput
          spellCheck={false}
          onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            onChangeName(value);
          }}
          id={kmsProviderName}
          onBlur={onSave}
          data-testid="csfle-kms-card-name"
          aria-label={'KMS Name'}
          type={'text'}
          state={validationError ? 'error' : 'none'}
          errorMessage={validationError}
          value={name}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave();
            }
          }}
        />
      </div>
    </div>
  );
}

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
  const onRenameKmsProvider = useCallback(
    (newName: KMSProviderName<T>) => {
      return updateConnectionFormField({
        type: 'rename-csfle-kms-provider',
        name: kmsProviderName,
        newName,
      });
    },
    [kmsProviderName, updateConnectionFormField]
  );
  const onRemoveKmsProvider = useCallback(() => {
    return updateConnectionFormField({
      type: 'remove-csfle-kms-provider',
      name: kmsProviderName,
    });
  }, [updateConnectionFormField, kmsProviderName]);

  const onValidateName = useCallback(
    (name: string) => {
      // Exclude the current KMS provider name from the list.
      const withoutCurrentKMSProviderNames = kmsProviderNames.filter(
        (n) => n !== kmsProviderName
      );
      const maybeProviderName =
        name === '' ? kmsProviderType : `${kmsProviderType}:${name}`;
      // `kmsProviderType` can only exist once, so empty name is allowed only for that case.
      if (
        name === '' &&
        withoutCurrentKMSProviderNames.some((n) => n === maybeProviderName)
      ) {
        return 'Name cannot be empty';
      }
      if (
        withoutCurrentKMSProviderNames.includes(
          maybeProviderName as KMSProviderName<T>
        )
      ) {
        return 'Name already exists';
      }
      const regex = new RegExp(`^${kmsProviderType}(:[a-zA-Z0-9_]+)?$`);
      if (!maybeProviderName.match(regex)) {
        return 'Name must be alphanumeric and may contain underscores';
      }
      return undefined;
    },
    [kmsProviderNames, kmsProviderName, kmsProviderType]
  );

  return (
    <Card
      data-card-index={index}
      data-testid={`${kmsProviderName}-kms-card-item`}
      className={cardStyles}
      {...hoverProps}
    >
      <div data-testid="kms-card-header" className={flexContainerStyles}>
        <KMSNameComponent
          kmsProviderName={kmsProviderName}
          kmsProviderType={kmsProviderType}
          onRename={onRenameKmsProvider}
          validateName={onValidateName}
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
