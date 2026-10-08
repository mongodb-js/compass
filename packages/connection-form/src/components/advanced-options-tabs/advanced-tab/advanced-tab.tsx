import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import type { ConnectionOptions } from 'mongodb-data-service';
import { FormFieldContainer, TextInput } from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

import UrlOptions from './url-options';
import ReadPreferenceForm from './read-preference-form';
import type { ConnectionFormError } from '../../../utils/validation';

function AdvancedTab({
  errors,
  updateConnectionFormField,
  connectionStringUrl,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions?: ConnectionOptions;
}): React.ReactElement {
  const { searchParams, pathname } = connectionStringUrl;
  const replicaSet = searchParams.get('replicaSet');
  const defaultDatabase = pathname.startsWith('/')
    ? pathname.substr(1)
    : pathname;

  const handleFieldChanged = useCallback(
    (key: keyof MongoClientOptions, value?: string) => {
      if (!value) {
        return updateConnectionFormField({
          type: 'delete-search-param',
          key,
        });
      }
      return updateConnectionFormField({
        type: 'update-search-param',
        currentKey: key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const handlePathChanged = useCallback(
    (value: string) => {
      return updateConnectionFormField({
        type: 'update-connection-path',
        value,
      });
    },
    [updateConnectionFormField]
  );

  return (
    <>
      <ReadPreferenceForm
        errors={errors}
        connectionStringUrl={connectionStringUrl}
        updateConnectionFormField={updateConnectionFormField}
      />

      {/* Replica Set */}
      <FormFieldContainer>
        <TextInput
          spellCheck={false}
          onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            handleFieldChanged('replicaSet', value);
          }}
          name={'replica-set'}
          data-testid={'replica-set'}
          label={'Replica Set Name'}
          type={'text'}
          optional={true}
          value={replicaSet ?? ''}
        />
      </FormFieldContainer>
      {/* Default Database */}

      <FormFieldContainer>
        <TextInput
          spellCheck={false}
          onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            handlePathChanged(value);
          }}
          name={'default-database'}
          data-testid={'default-database'}
          label={'Default Authentication Database'}
          type={'text'}
          optional={true}
          value={defaultDatabase ?? ''}
          description={
            'Authentication database used when authSource is not specified.'
          }
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <UrlOptions
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormField}
        />
      </FormFieldContainer>
    </>
  );
}

export default AdvancedTab;
