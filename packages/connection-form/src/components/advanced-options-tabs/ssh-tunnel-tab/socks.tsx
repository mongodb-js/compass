import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import { FormFieldContainer, TextInput } from '@mongodb-js/compass-components';
import type { MongoClientOptions } from 'mongodb';
import type ConnectionStringUrl from 'mongodb-connection-string-url';

import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

interface Field {
  name: keyof Pick<
    MongoClientOptions,
    'proxyHost' | 'proxyPort' | 'proxyUsername' | 'proxyPassword'
  >;
  label: string;
  type: 'number' | 'password' | 'text';
  optional: boolean;
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

  const fields: Field[] = [
    {
      name: 'proxyHost',
      label: 'Proxy Hostname',
      type: 'text',
      optional: false,
      value: typedSearchParams.get('proxyHost') ?? '',
      errorMessage: errorMessageByFieldName(errors, 'proxyHostname'),
      state: fieldNameHasError(errors, 'proxyHostname') ? 'error' : 'none',
    },
    {
      name: 'proxyPort',
      label: 'Proxy Tunnel Port',
      type: 'number',
      optional: true,
      value: typedSearchParams.get('proxyPort') ?? '',
      state: 'none',
    },
    {
      name: 'proxyUsername',
      label: 'Proxy Username',
      type: 'text',
      optional: true,
      value: typedSearchParams.get('proxyUsername') ?? '',
      state: 'none',
    },
    {
      name: 'proxyPassword',
      label: 'Proxy Password',
      type: 'password',
      optional: true,
      value: typedSearchParams.get('proxyPassword') ?? '',
      state: 'none',
    },
  ];

  return (
    <>
      {fields.map(
        ({ name, label, type, optional, value, errorMessage, state }) => (
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
