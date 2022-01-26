import React, { ChangeEvent } from 'react';
import { SSHConnectionOptions } from '../../../utils/connection-ssh-handler';
import FormFieldContainer from '../../form-field-container';
import {
  ConnectionFormError,
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';

import { useUiKitContext } from '../../../contexts/ui-kit-context';

type PasswordFormKeys = keyof Omit<
  SSHConnectionOptions,
  'identityKeyFile' | 'identityKeyPassphrase'
>;

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
  errors: ConnectionFormError[];
}): React.ReactElement {
  const { TextInput } = useUiKitContext();
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
      errorMessage: errorMessageByFieldName(errors, 'sshHostname'),
      state: fieldNameHasError(errors, 'sshHostname') ? 'error' : 'none',
    },
    {
      name: 'port',
      label: 'SSH Port',
      type: 'number',
      optional: false,
      placeholder: 'SSH Port',
      value: (sshTunnelOptions?.port ?? '').toString(),
      errorMessage: undefined,
      state: 'none',
    },
    {
      name: 'username',
      label: 'SSH Username',
      type: 'text',
      optional: false,
      placeholder: 'SSH Username',
      value: sshTunnelOptions?.username,
      errorMessage: errorMessageByFieldName(errors, 'sshUsername'),
      state: fieldNameHasError(errors, 'sshUsername') ? 'error' : 'none',
    },
    {
      name: 'password',
      label: 'SSH Password',
      type: 'password',
      optional: true,
      placeholder: 'SSH Password',
      value: sshTunnelOptions?.password,
      errorMessage: errorMessageByFieldName(errors, 'sshPassword'),
      state: fieldNameHasError(errors, 'sshPassword') ? 'error' : 'none',
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
              spellCheck={false}
            />
          </FormFieldContainer>
        )
      )}
    </>
  );
}

export default Password;
