import React, { ChangeEvent, useCallback } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import { MongoClientOptions } from 'mongodb';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { defaultSocksPort } from '../../../constants/default-connection';
import FormFieldContainer from '../../form-field-container';
import {
  ConnectionFormError,
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

interface Field {
  name: keyof Pick<
    MongoClientOptions,
    'proxyHost' | 'proxyPort' | 'proxyUsername' | 'proxyPassword'
  >;
  label: string;
  type: string;
  optional: boolean;
  placeholder: string;
  value: string;
  errorMessage?: string;
  state: 'error' | 'none';
}

function Socks({
  updateConnectionFormField,
  errors,
  connectionStringUrl,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
}): React.ReactElement {
  const typedSearchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();

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

  const fields: Field[] = [
    {
      name: 'proxyHost',
      label: 'Proxy Hostname',
      type: 'text',
      optional: false,
      placeholder: 'Proxy Hostname',
      value: typedSearchParams.get('proxyHost') ?? '',
      errorMessage: errorMessageByFieldName(errors, 'proxyUsername'),
      state: fieldNameHasError(errors, 'proxyUsername') ? 'error' : 'none',
    },
    {
      name: 'proxyPort',
      label: 'Proxy Tunnel Port',
      type: 'number',
      optional: false,
      placeholder: 'Proxy Tunnel Port',
      value: typedSearchParams.get('proxyPort') ?? `${defaultSocksPort}`,
      state: 'none',
    },
    {
      name: 'proxyUsername',
      label: 'Proxy Username',
      type: 'text',
      optional: false,
      placeholder: 'Proxy Username',
      value: typedSearchParams.get('proxyUsername') ?? '',
      state: 'none',
    },
    {
      name: 'proxyPassword',
      label: 'Proxy Password',
      type: 'password',
      optional: true,
      placeholder: 'Proxy Password',
      value: typedSearchParams.get('proxyPassword') ?? '',
      state: 'none',
    },
  ];

  return (
    <>
      {fields.map(
        ({
          name,
          label,
          type,
          optional,
          placeholder,
          value,
          errorMessage,
          state,
        }) => (
          <FormFieldContainer key={name}>
            <TextInput
              onChange={({
                target: { value },
              }: ChangeEvent<HTMLInputElement>) => {
                handleFieldChanged(name, value);
              }}
              name={name}
              data-testid={name}
              label={label}
              type={type}
              optional={optional}
              placeholder={placeholder}
              value={value}
              errorMessage={errorMessage}
              state={state}
              spellCheck={false}
            />
          </FormFieldContainer>
        )
      )}
    </>
  );
}

export default Socks;
