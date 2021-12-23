import React, { ChangeEvent } from 'react';
import { TextInput } from '@mongodb-js/compass-components';
import { SSHConnectionOptions } from '../../../utils/connection-options-handler';
import FormFieldContainer from '../../form-field-container';

type PasswordFormKeys = keyof Omit<
  SSHConnectionOptions,
  'identityKeyFile' | 'identityKeyPassphrase'
>;
type PasswordFormErrors = {
  [key in PasswordFormKeys]?: string;
};

function Password({
  sshTunnelOptions,
  onConnectionOptionChanged,
  errors,
}: {
  sshTunnelOptions?: SSHConnectionOptions;
  onConnectionOptionChanged: (
    key: PasswordFormKeys,
    value: string | number
  ) => void;
  errors?: PasswordFormErrors;
}): React.ReactElement {
  const formFieldChanged = (key: PasswordFormKeys, value: string | number) => {
    onConnectionOptionChanged(key, value);
  };

  const fields = [
    {
      name: 'host',
      label: 'SSH Hostname',
      type: 'text',
      optional: false,
      placeholder: 'SSH Hostname',
      value: sshTunnelOptions?.host,
      errorMessage: errors?.host,
      state: errors?.host ? 'error' : 'none',
    },
    {
      name: 'port',
      label: 'SSH Port',
      type: 'number',
      optional: false,
      placeholder: 'SSH Port',
      value: (sshTunnelOptions?.port ?? '').toString(),
      errorMessage: errors?.port,
      state: errors?.port ? 'error' : 'none',
    },
    {
      name: 'username',
      label: 'SSH Username',
      type: 'text',
      optional: false,
      placeholder: 'SSH Username',
      value: sshTunnelOptions?.username,
      errorMessage: errors?.username,
      state: errors?.username ? 'error' : 'none',
    },
    {
      name: 'password',
      label: 'SSH Password',
      type: 'password',
      optional: true,
      placeholder: 'SSH Password',
      value: sshTunnelOptions?.password,
      errorMessage: errors?.password,
      state: errors?.password ? 'error' : 'none',
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
                  name as PasswordFormKeys,
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

export default Password;
