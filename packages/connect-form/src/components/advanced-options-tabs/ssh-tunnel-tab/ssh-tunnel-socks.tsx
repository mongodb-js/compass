import React, { ChangeEvent, useCallback } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import { MongoClientOptions } from 'mongodb';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import FormFieldContainer from '../../form-field-container';
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
}

function Socks({
  updateConnectionFormField,
  connectionStringUrl,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
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
    },
    {
      name: 'proxyPort',
      label: 'Proxy Tunnel Port',
      type: 'number',
      optional: true,
      placeholder: 'Proxy Tunnel Port',
      value: typedSearchParams.get('proxyPort') ?? '',
    },
    {
      name: 'proxyUsername',
      label: 'Proxy Username',
      type: 'text',
      optional: true,
      placeholder: 'Proxy Username',
      value: typedSearchParams.get('proxyUsername') ?? '',
    },
    {
      name: 'proxyPassword',
      label: 'Proxy Password',
      type: 'password',
      optional: true,
      placeholder: 'Proxy Password',
      value: typedSearchParams.get('proxyPassword') ?? '',
    },
  ];

  return (
    <>
      {fields.map(({ name, label, type, optional, placeholder, value }) => (
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
            spellCheck={false}
          />
        </FormFieldContainer>
      ))}
    </>
  );
}

export default Socks;
