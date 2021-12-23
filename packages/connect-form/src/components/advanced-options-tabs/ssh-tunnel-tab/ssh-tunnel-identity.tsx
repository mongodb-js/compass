import React, { ChangeEvent } from 'react';
import { css, cx } from '@emotion/css';
import { TextInput, FileInput } from '@mongodb-js/compass-components';
import { SSHConnectionOptions } from '../../../utils/connection-options-handler';
import FormFieldContainer from '../../form-field-container';

type IdentityFormKeys = keyof SSHConnectionOptions;
type IdentityFormErrors = {
  [key in IdentityFormKeys]?: string;
};

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
  errors?: IdentityFormErrors;
}): React.ReactElement {
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
      errorMessage: errors?.host,
      state: errors?.host ? 'error' : 'none',
    },
    {
      name: 'port',
      label: 'SSH Tunnel Port',
      type: 'number',
      optional: false,
      placeholder: 'SSH Tunnel Port',
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
      name: 'identityKeyFile',
      label: 'SSH Identity File',
      type: 'file',
      errorMessage: errors?.identityKeyFile,
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
      errorMessage: errors?.identityKeyPassphrase,
      state: errors?.identityKeyPassphrase ? 'error' : 'none',
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
              />
            </FormFieldContainer>
          );
        }
      )}
    </>
  );
}

export default Identity;
