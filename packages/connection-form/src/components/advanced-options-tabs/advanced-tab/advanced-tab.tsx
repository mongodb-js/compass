import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import type { ConnectionOptions } from 'mongodb-data-service';
import {
  FormFieldContainer,
  Label,
  RadioBox,
  RadioBoxGroup,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions, ReadPreferenceMode } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

import UrlOptions from './url-options';
import type { ConnectionFormError } from '../../../utils/validation';

const defaultReadPreference = 'defaultReadPreference';

interface ReadPreference {
  title: string;
  id: ReadPreferenceMode;
}

export const readPreferences: ReadPreference[] = [
  {
    title: 'Primary',
    id: 'primary',
  },
  {
    title: 'Primary Preferred',
    id: 'primaryPreferred',
  },
  {
    title: 'Secondary',
    id: 'secondary',
  },
  {
    title: 'Secondary Preferred',
    id: 'secondaryPreferred',
  },
  {
    title: 'Nearest',
    id: 'nearest',
  },
];

const containerStyles = css({
  marginTop: spacing[3],
});

function AdvancedTab({
  updateConnectionFormField,
  connectionStringUrl,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions?: ConnectionOptions;
}): React.ReactElement {
  const { searchParams, pathname } = connectionStringUrl;
  const readPreference = searchParams.get('readPreference');
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
    <div className={containerStyles}>
      {/* Read Preferences */}
      <Label htmlFor="read-preferences">Read Preference</Label>
      <RadioBoxGroup
        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
          handleFieldChanged(
            'readPreference',
            // Unset the read preference when default is selected.
            value === defaultReadPreference ? undefined : value
          );
        }}
        value={readPreference ?? defaultReadPreference}
        data-testid="read-preferences"
        id="read-preferences"
        size="compact"
      >
        <RadioBox
          id="default-preference-button"
          data-testid="default-preference-button"
          key="defaultReadPreference"
          value={defaultReadPreference}
          checked={!readPreference}
        >
          Default
        </RadioBox>
        {readPreferences.map(({ title, id }) => {
          return (
            <RadioBox
              id={`${id}-preference-button`}
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
      <UrlOptions
        connectionStringUrl={connectionStringUrl}
        updateConnectionFormField={updateConnectionFormField}
      />
    </div>
  );
}

export default AdvancedTab;
