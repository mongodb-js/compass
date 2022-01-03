import React, { ChangeEvent, useCallback } from 'react';
import { css } from '@emotion/css';
import { ConnectionOptions } from 'mongodb-data-service';
import {
  RadioBox,
  RadioBoxGroup,
  spacing,
  TextInput,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ReadPreferenceMode, ReadPreference as MongoReadPreference, MongoClientOptions } from 'mongodb';

import {UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import {
  ConnectionFormError,
} from '../../../utils/connect-form-errors';
import FormFieldContainer from '../../form-field-container';
import UrlOptions from './url-options';

const containerStyles = css({
  marginTop: spacing[3],
});

const fieldStyles = css({
  width: '50%',
});

interface ReadPreference {
  title: string;
  id: ReadPreferenceMode;
}

interface UrlOption {
  key: string;
  value: string;
}

const readPreferences: ReadPreference[] = [
  {
    title: 'Primary',
    id: MongoReadPreference.PRIMARY,
  },
  {
    title: 'Primary Preferred',
    id: MongoReadPreference.PRIMARY_PREFERRED,
  },
  {
    title: 'Secondary',
    id: MongoReadPreference.SECONDARY,
  },
  {
    title: 'Secondary Preferred',
    id: MongoReadPreference.SECONDARY_PREFERRED,
  },
  {
    title: 'Nearest',
    id: MongoReadPreference.NEAREST,
  },
];

const editableUrlOptions = [
  'connectiTimeoutMS',
  'socketTimeoutMS',
  'compressors',
  'zlibCompressionLevel',
  'maxPoolSize',
  'minPoolSize',
  'maxIdleTimeMS',
  'waitQueueMultiple',
  'waitQueueTimeoutMS',
  'w',
  'wtimeoutMS',
  'journal',
  'readConcernLevel',
  'maxStalenessSeconds',
  'readPreferenceTags',
  // 'authSource',
  'authMechanismProperties',
  'gssapiServiceName',
  'localThresholdMS',
  'serverSelectionTimeoutMS',
  'serverSelectionTryOnce',
  'heartbeatFrequencyMS',
  'appName',
  'retryReads',
  'retryWrites',
  'uuidRepresentation',
];

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
      updateConnectionFormField({
        type: 'update-search-param',
        key,
        value,
      });
    },
    [updateConnectionFormField],
  );

  const readPreference = connectionStringUrl.searchParams.get('readPreference');
  const replicaSet = connectionStringUrl.searchParams.get('replicaSet');
  const authSource = connectionStringUrl.searchParams.get('authSource');

  const urlOptions: UrlOption[] = [];
  editableUrlOptions.forEach((key: string) => {
    if (connectionStringUrl.searchParams.has(key)) {
      urlOptions.push({
        key,
        value: connectionStringUrl.searchParams.get(key) as string,
      });
    }
  });

  return (
    <div className={containerStyles}>
      {/* Read Preferences */}
      <RadioBoxGroup
        onChange={({target: {value}}: ChangeEvent<HTMLInputElement>) => {
          handleFieldChanged('readPreference', value);
        }}
        className="radio-box-group-style"
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
          onChange={({
            target: { value },
          }: ChangeEvent<HTMLInputElement>) => {
            handleFieldChanged('replicaSet', value);
          }}
          name={'replica-set'}
          data-testid={'replica-set'}
          label={'Replica Set Name'}
          type={'text'}
          optional={true}
          placeholder={'Replica Set Name'}
          value={replicaSet ?? undefined}
        />
      </FormFieldContainer>
      {/* Default Database */}
      <FormFieldContainer>
        <TextInput
          className={fieldStyles}
          onChange={({
            target: { value },
          }: ChangeEvent<HTMLInputElement>) => {
            handleFieldChanged('authSource', value);
          }}
          name={'default-database'}
          data-testid={'default-database'}
          label={'Default Database'}
          type={'text'}
          optional={true}
          placeholder={'Default Database'}
          value={authSource ?? undefined}
          description={'Default database will be the one you authenticate on. Leave this field empty if you want the default behaviour.'}
        />
      </FormFieldContainer>
      <UrlOptions
        connectionStringUrl={connectionStringUrl}
        handleFieldChanged={handleFieldChanged} />
    </div>
  );
}

export default AdvancedTab;
