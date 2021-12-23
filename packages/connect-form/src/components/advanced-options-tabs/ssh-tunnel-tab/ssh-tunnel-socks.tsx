import React, { ChangeEvent } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import { SSHConnectionOptions } from '../../../utils/connection-options-handler';
import { defaultSocksPort } from '../../../constants/default-connection';
import FormFieldContainer from '../../form-field-container';

type SocksFormKeys = keyof Omit<
  SSHConnectionOptions,
  'identityKeyFile' | 'identityKeyPassphrase'
>;
type SocksFormErrors = {
  [key in SocksFormKeys]?: string;
};

function Socks({
  sshTunnelOptions,
  onConnectionOptionChanged,
  errors,
}: {
  sshTunnelOptions?: SSHConnectionOptions;
  onConnectionOptionChanged: (
    key: SocksFormKeys,
    value: string | number
  ) => void;
  errors?: SocksFormErrors;
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
      value: sshTunnelOptions?.host,
      errorMessage: errors?.host,
      state: errors?.host ? 'error' : 'none',
    },
    {
      name: 'port',
      label: 'Proxy Tunnel Port',
      type: 'number',
      optional: false,
      placeholder: 'Proxy Tunnel Port',
      value: (sshTunnelOptions?.port ?? defaultSocksPort).toString(),
      errorMessage: errors?.port,
      state: errors?.port ? 'error' : 'none',
    },
    {
      name: 'username',
      label: 'Proxy Username',
      type: 'text',
      optional: false,
      placeholder: 'Proxy Username',
      value: sshTunnelOptions?.username,
      errorMessage: errors?.username,
      state: errors?.username ? 'error' : 'none',
    },
    {
      name: 'password',
      label: 'Proxy Password',
      type: 'password',
      optional: true,
      placeholder: 'Proxy Password',
      value: sshTunnelOptions?.password,
      errorMessage: errors?.password,
      state: errors?.password ? 'error' : 'none',
    }
  ];

  return (
    <>
      {fields.map(({name, label, type, optional, placeholder, value, errorMessage, state}) => (
        <FormFieldContainer key={name}>
          <TextInput
            onChange={({target: { value}}: ChangeEvent<HTMLInputElement>) => {
              formFieldChanged(name as SocksFormKeys, name === 'port' ? Number(value) : value);
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
      ))}
    </>
  );
}

export default Socks;
