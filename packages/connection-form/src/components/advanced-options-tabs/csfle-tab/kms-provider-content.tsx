import React, { useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  css,
  Icon,
  IconButton,
  spacing,
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

function getNextKmsProviderName<T extends KMSProviderType>(
  kmsProviderType: T,
  currentProviders: string[]
): KMSProviderName<T> {
  const currentNums = currentProviders
    .map((name) => parseInt(name.split(':')[1], 10))
    .filter((num) => !isNaN(num));
  const name = currentNums.length === 0 ? 1 : Math.max(...currentNums) + 1;
  return `${kmsProviderType}:${name}`;
}

function KMSProviderCard<T extends KMSProviderType>({
  kmsProviderName,
  showHeader,
  onRemove,
  updateConnectionFormField,
  connectionOptions,
  errors,
  kmsProviderType,
  fields,
  clientCertIsOptional,
  noTLS,
}: KMSProviderContentProps<T> & {
  kmsProviderName: KMSProviderName<T>;
  showHeader: boolean;
  onRemove: () => void;
}) {
  const [hoverProps, isHovered] = useHoverState();
  return (
    <Card
      data-testid={`${kmsProviderName}-kms-card-item`}
      key={kmsProviderName}
      className={cardStyles}
      {...hoverProps}
    >
      {showHeader && (
        <div data-testid="kms-card-header" className={flexContainerStyles}>
          <h4>{kmsProviderName}</h4>
          {isHovered && (
            <IconButton
              aria-label="Remove KMS provider"
              className={pushRightStyles}
              onClick={onRemove}
            >
              <Icon glyph="Trash" />
            </IconButton>
          )}
        </div>
      )}
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

type KMSProviderContentProps<T extends KMSProviderType> = {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
  kmsProviderType: T;
  fields: KMSField<T>[];
  clientCertIsOptional?: boolean;
  noTLS?: boolean;
};

function KMSProviderContent<T extends KMSProviderType>({
  updateConnectionFormField,
  connectionOptions,
  kmsProviderType,
  ...restOfTheProps
}: KMSProviderContentProps<T>): React.ReactElement {
  const kmsProviderNames = useMemo(() => {
    const keys = Object.keys(
      connectionOptions.fleOptions?.autoEncryption?.kmsProviders ?? {}
    ).filter((x) => x.startsWith(kmsProviderType));
    if (keys.length === 0) {
      return [kmsProviderType];
    }
    return keys as Array<KMSProviderName<T>>;
  }, [
    connectionOptions.fleOptions?.autoEncryption?.kmsProviders,
    kmsProviderType,
  ]);

  const addNewKmsProvider = useCallback(
    (name: KMSProviderName<T>) => {
      return updateConnectionFormField({
        type: 'add-new-csfle-kms-provider',
        name,
      });
    },
    [updateConnectionFormField]
  );

  const removeKmsProvider = useCallback(
    (name: KMSProviderName<T>) => {
      return updateConnectionFormField({
        type: 'remove-csfle-kms-provider',
        name,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <>
      {kmsProviderNames.map((kmsProviderName) => (
        <KMSProviderCard
          key={kmsProviderName}
          connectionOptions={connectionOptions}
          updateConnectionFormField={updateConnectionFormField}
          kmsProviderType={kmsProviderType}
          kmsProviderName={kmsProviderName}
          showHeader={kmsProviderNames.length > 1}
          onRemove={() => removeKmsProvider(kmsProviderName)}
          {...restOfTheProps}
        />
      ))}
      <div className={flexContainerStyles}>
        <Button
          className={pushRightStyles}
          variant="primaryOutline"
          onClick={() => {
            addNewKmsProvider(
              getNextKmsProviderName(kmsProviderType, kmsProviderNames)
            );
          }}
        >
          <Icon size="xsmall" glyph="Plus" />
          Add item
        </Button>
      </div>
    </>
  );
}

export default KMSProviderContent;
