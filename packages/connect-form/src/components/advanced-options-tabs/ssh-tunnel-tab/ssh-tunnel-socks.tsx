import React, { ChangeEvent } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import { SSHConnectionOptions } from '../../../utils/connection-ssh-handler';
import { defaultSocksPort } from '../../../constants/default-connection';
import FormFieldContainer from '../../form-field-container';
import { ConnectionFormError } from '../../../utils/validation';

type SocksFormKeys = keyof Omit<
  SSHConnectionOptions,
  'identityKeyFile' | 'identityKeyPassphrase'
>;

function Socks({
  onConnectionOptionChanged,
}: {
  onConnectionOptionChanged: (
    key: SocksFormKeys,
    value: string | number
  ) => void;
  errors: ConnectionFormError[];
}): React.ReactElement {
  const formFieldChanged = (key: SocksFormKeys, value: string | number) => {
    onConnectionOptionChanged(key, value);
  };

  const fields = [
    {
      name: 'host',
      label: 'Proxy Hostname',
      type: 'text',
      optional: false,
      placeholder: 'Proxy Hostname',
      value: '',
      errorMessage: undefined,
      state: 'none',
    },
    {
      name: 'port',
      label: 'Proxy Tunnel Port',
      type: 'number',
      optional: false,
      placeholder: 'Proxy Tunnel Port',
      value: `${defaultSocksPort}`,
      errorMessage: undefined,
      state: 'none',
    },
    {
      name: 'username',
      label: 'Proxy Username',
      type: 'text',
      optional: false,
      placeholder: 'Proxy Username',
      value: '',
      errorMessage: undefined,
      state: 'none',
    },
    {
      name: 'password',
      label: 'Proxy Password',
      type: 'password',
      optional: true,
      placeholder: 'Proxy Password',
      value: '',
      errorMessage: '',
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
                formFieldChanged(
                  name as SocksFormKeys,
                  name === 'port' ? Number(value) : value
                );
              }}
              name={name}
              data-testid={name}
              label={label}
              type={type}
              optional={optional}
              placeholder={placeholder}
              value={value}
              errorMessage={errorMessage}
              state={state as 'error' | 'none'}
            />
          </FormFieldContainer>
        )
      )}
    </>
  );
}

export default Socks;
