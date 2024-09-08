import React, { useCallback } from 'react';
import { Button, css, Icon } from '@mongodb-js/compass-components';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type {
  KMSField,
  KMSProviderType,
  KMSProviderName,
} from '../../../utils/csfle-kms-fields';
import type { ConnectionFormError } from '../../../utils/validation';
import type { ConnectionOptions } from 'mongodb-data-service';
import KMSProviderCard from './kms-provider-card';

const flexContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const pushRightStyles = css({
  marginLeft: 'auto',
});

export function getNextKmsProviderName<T extends KMSProviderType>(
  kmsProviderType: T,
  currentProviders: string[] = []
): KMSProviderName<T> {
  if (currentProviders.length === 0) {
    return kmsProviderType;
  }
  const currentNums = currentProviders // local:1
    .map((name) => name.split(':')[1]?.replace(kmsProviderType, '')) // '1'
    .map((x) => parseInt(x, 10)) // 1
    .filter((x) => !isNaN(x));
  const nextNum = Math.max(0, ...currentNums) + 1;
  return `${kmsProviderType}:${nextNum}`; // local:2
}

type KMSProviderContentProps<T extends KMSProviderType> = {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
  kmsProviderType: T;
  kmsProviderNames: KMSProviderName<T>[];
  fields: KMSField<T>[];
  clientCertIsOptional?: boolean;
  noTLS?: boolean;
};

function KMSProviderContent<T extends KMSProviderType>({
  updateConnectionFormField,
  connectionOptions,
  kmsProviderType,
  kmsProviderNames,
  ...restOfTheProps
}: KMSProviderContentProps<T>): React.ReactElement {
  const onAddKmsProvider = useCallback(
    (name: KMSProviderName<T>) => {
      return updateConnectionFormField({
        type: 'add-new-csfle-kms-provider',
        name,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <>
      {kmsProviderNames.map((kmsProviderName, index) => (
        <KMSProviderCard
          key={index}
          index={index}
          connectionOptions={connectionOptions}
          updateConnectionFormField={updateConnectionFormField}
          kmsProviderType={kmsProviderType}
          kmsProviderName={kmsProviderName}
          kmsProviderNames={kmsProviderNames}
          {...restOfTheProps}
        />
      ))}
      <div className={flexContainerStyles}>
        <Button
          data-testid={'csfle-add-new-kms-provider-button'}
          className={pushRightStyles}
          variant="primaryOutline"
          onClick={() => {
            onAddKmsProvider(
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
