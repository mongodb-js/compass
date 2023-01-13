import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import { FormFieldContainer, TextInput } from '@mongodb-js/compass-components';
import type { SSHConnectionOptions } from '../../../utils/connection-ssh-handler';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

type PasswordFormKeys = keyof Omit<
  SSHConnectionOptions,
  'identityKeyFile' | 'identityKeyPassphrase'
>;

function SshTunnelPassword({
  sshTunnelOptions,
  updateConnectionFormField,
  errors,
}: {
  sshTunnelOptions?: SSHConnectionOptions;
  updateConnectionFormField: UpdateConnectionFormField;
  errors: ConnectionFormError[];
}): React.ReactElement {
  const formFieldChanged = useCallback(
    (key: PasswordFormKeys, value: string) => {
      return updateConnectionFormField({
        type: 'update-ssh-options',
        key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const fields: {
    name: PasswordFormKeys;
    label: string;
    type: 'text' | 'number' | 'password';
    optional: boolean;
    value?: string;
    errorMessage: string | undefined;
    state: 'error' | 'none';
  }[] = [
    {
      name: 'host',
      label: 'SSH Hostname',
      type: 'text',
      optional: false,
      value: sshTunnelOptions?.host,
      errorMessage: errorMessageByFieldName(errors, 'sshHostname'),
      state: fieldNameHasError(errors, 'sshHostname') ? 'error' : 'none',
    },
    {
      name: 'port',
      label: 'SSH Port',
      type: 'number',
      optional: false,
      value: sshTunnelOptions?.port?.toString(),
      errorMessage: undefined,
      state: 'none',
    },
    {
      name: 'username',
      label: 'SSH Username',
      type: 'text',
      optional: false,
      value: sshTunnelOptions?.username,
      errorMessage: errorMessageByFieldName(errors, 'sshUsername'),
      state: fieldNameHasError(errors, 'sshUsername') ? 'error' : 'none',
    },
    {
      name: 'password',
      label: 'SSH Password',
      type: 'password',
      optional: true,
      value: sshTunnelOptions?.password,
      errorMessage: errorMessageByFieldName(errors, 'sshPassword'),
      state: fieldNameHasError(errors, 'sshPassword') ? 'error' : 'none',
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
                formFieldChanged(name, value);
              }}
              name={name}
              data-testid={name}
              label={label}
              type={type}
              optional={optional}
              value={value || ''}
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

export default SshTunnelPassword;
