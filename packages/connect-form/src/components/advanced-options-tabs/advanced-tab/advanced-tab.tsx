import React, { ChangeEvent, useCallback } from 'react';
import { css } from '@emotion/css';
import { ConnectionOptions } from 'mongodb-data-service';
import {
  RadioBox,
  RadioBoxGroup,
  spacing,
  TextInput,
  Label,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { MongoClientOptions } from 'mongodb';

import FormFieldContainer from '../../form-field-container';
import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import { ConnectionFormError } from '../../../utils/connect-form-errors';
import { readPreferences } from '../../../utils/read-preferences';

import UrlOptions from './url-options';

const containerStyles = css({
  marginTop: spacing[3],
});

const fieldStyles = css({
  width: '50%',
});

function AdvancedTab({
  updateConnectionFormField,
  connectionStringUrl,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  hideError: (errorIndex: number) => void;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions?: ConnectionOptions;
}): React.ReactElement {
  const handleFieldChanged = useCallback(
    (key: keyof MongoClientOptions, value: unknown) => {
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

  const readPreference = connectionStringUrl.searchParams.get('readPreference');
  const replicaSet = connectionStringUrl.searchParams.get('replicaSet');
  const authSource = connectionStringUrl.searchParams.get('authSource');

  return (
    <div className={containerStyles}>
      {/* Read Preferences */}
      <Label htmlFor="read-preferences">Read Preference</Label>
      <RadioBoxGroup
        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
          handleFieldChanged('readPreference', value);
        }}
        data-testid="read-preferences"
        id="read-preferences"
      >
        {readPreferences.map(({ title, id }) => {
          return (
            <RadioBox
              data-testid={`${id}-preference-button`}
              checked={readPreference === id}
              value={id}
              key={id}
            >
              {title}
            </RadioBox>
          );
        })}
      </RadioBoxGroup>
      {/* Replica Set */}
      <FormFieldContainer>
        <TextInput
          className={fieldStyles}
          onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            handleFieldChanged('replicaSet', value);
          }}
          name={'replica-set'}
          data-testid={'replica-set'}
          label={'Replica Set Name'}
          type={'text'}
          optional={true}
          placeholder={'Replica Set Name'}
          value={replicaSet ?? ''}
        />
      </FormFieldContainer>
      {/* Default Database */}
      <FormFieldContainer>
        <TextInput
          className={fieldStyles}
          onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
            handleFieldChanged('authSource', value);
          }}
          name={'default-database'}
          data-testid={'default-database'}
          label={'Default Database'}
          type={'text'}
          optional={true}
          placeholder={'Default Database'}
          value={authSource ?? ''}
          description={
            'Default database will be the one you authenticate on. Leave this field empty if you want the default behaviour.'
          }
        />
      </FormFieldContainer>
      <UrlOptions
        connectionStringUrl={connectionStringUrl}
        updateConnectionFormField={updateConnectionFormField}
      />
    </div>
  );
}

export default AdvancedTab;
