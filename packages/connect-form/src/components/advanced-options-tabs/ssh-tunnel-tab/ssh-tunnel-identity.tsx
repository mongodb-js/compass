import React, { ChangeEvent } from 'react';
import { SSHConnectionOptions } from '../../../utils/connection-ssh-handler';
import FormFieldContainer from '../../form-field-container';
import {
  ConnectionFormError,
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';

import { useUiKitContext } from '../../../contexts/ui-kit-context';

type IdentityFormKeys = keyof SSHConnectionOptions;

function Identity({
  sshTunnelOptions,
  onConnectionOptionChanged,
  errors,
}: {
  sshTunnelOptions?: SSHConnectionOptions;
  onConnectionOptionChanged: (
    key: IdentityFormKeys,
    value: string | number
  ) => void;
  errors: ConnectionFormError[];
}): React.ReactElement {
  const { TextInput, FileInput } = useUiKitContext();

  const formFieldChanged = (key: IdentityFormKeys, value: string | number) => {
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
      label: 'SSH Tunnel Port',
      type: 'number',
      optional: false,
      placeholder: 'SSH Tunnel Port',
      value: (sshTunnelOptions?.port ?? '').toString(),
      errorMessage: '',
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
      name: 'identityKeyFile',
      label: 'SSH Identity File',
      type: 'file',
      errorMessage: errorMessageByFieldName(errors, 'sshIdentityKeyFile'),
      state: fieldNameHasError(errors, 'sshIdentityKeyFile') ? 'error' : 'none',
      value:
        sshTunnelOptions?.identityKeyFile && sshTunnelOptions.identityKeyFile
          ? [sshTunnelOptions.identityKeyFile]
          : undefined,
    },
    {
      name: 'identityKeyPassphrase',
      label: 'SSH Passphrase',
      type: 'password',
      optional: true,
      placeholder: 'SSH Passphrase',
      value: sshTunnelOptions?.identityKeyPassphrase,
      errorMessage: undefined,
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
        }) => {
          if (type === 'file') {
            return (
              <FormFieldContainer key={name}>
                <FileInput
                  id={name}
                  dataTestId={name}
                  onChange={(files: string[]) => {
                    formFieldChanged(name as IdentityFormKeys, files[0]);
                  }}
                  label={label}
                  error={Boolean(errorMessage)}
                  errorMessage={errorMessage}
                  values={value as string[] | undefined}
                  description={'Learn More'}
                  link={'https://mongodb.com'}
                />
              </FormFieldContainer>
            );
          }
          return (
            <FormFieldContainer key={name}>
              <TextInput
                onChange={({
                  target: { value },
                }: ChangeEvent<HTMLInputElement>) => {
                  formFieldChanged(
                    name as IdentityFormKeys,
                    name === 'port' ? Number(value) : value
                  );
                }}
                name={name}
                data-testid={name}
                label={label}
                type={type}
                optional={optional}
                placeholder={placeholder}
                value={value as string | undefined}
                errorMessage={errorMessage}
                state={state as 'error' | 'none'}
                spellCheck={false}
              />
            </FormFieldContainer>
          );
        }
      )}
    </>
  );
}

export default Identity;
