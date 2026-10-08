import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import {
  FormFieldContainer,
  TextInput,
  FilePickerDialog,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { SSHConnectionOptions } from '../../../utils/connection-ssh-handler';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldName,
  fieldNameHasError,
} from '../../../utils/validation';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

type IdentityFormKeys = keyof Pick<
  SSHConnectionOptions,
  'host' | 'port' | 'username' | 'identityKeyFile' | 'identityKeyPassphrase'
>;

type FileInputField = {
  name: IdentityFormKeys;
  label: string;
  type: 'file';
  optional?: boolean;
  value: string[] | undefined;
  errorMessage: string | undefined;
  state: 'error' | 'none';
};
type TextInputField = {
  name: IdentityFormKeys;
  label: string;
  type: 'text' | 'number' | 'password';
  optional?: boolean;
  value: string | undefined;
  errorMessage: string | undefined;
  state: 'error' | 'none';
};

function SshTunnelIdentity({
  sshTunnelOptions,
  updateConnectionFormField,
  errors,
}: {
  sshTunnelOptions?: SSHConnectionOptions;
  updateConnectionFormField: UpdateConnectionFormField;
  errors: ConnectionFormError[];
}): React.ReactElement {
  const t = useTranslation();
  const formFieldChanged = useCallback(
    (key: IdentityFormKeys, value: string | undefined) => {
      return updateConnectionFormField({
        type: 'update-ssh-options',
        key,
        value,
      });
    },
    [updateConnectionFormField]
  );

  const fields: Array<TextInputField | FileInputField> = [
    {
      name: 'host',
      label: t('connections.form.ssh.hostname', 'SSH Hostname'),
      type: 'text',
      optional: false,
      value: sshTunnelOptions?.host,
      errorMessage: errorMessageByFieldName(errors, 'sshHostname'),
      state: fieldNameHasError(errors, 'sshHostname') ? 'error' : 'none',
    },
    {
      name: 'port',
      label: t('connections.form.ssh.port', 'SSH Port'),
      type: 'number',
      optional: false,
      value: sshTunnelOptions?.port?.toString(),
      errorMessage: '',
      state: 'none',
    },
    {
      name: 'username',
      label: t('connections.form.ssh.username', 'SSH Username'),
      type: 'text',
      optional: false,
      value: sshTunnelOptions?.username,
      errorMessage: errorMessageByFieldName(errors, 'sshUsername'),
      state: fieldNameHasError(errors, 'sshUsername') ? 'error' : 'none',
    },
    {
      name: 'identityKeyFile',
      label: t('connections.form.ssh.identityFile', 'SSH Identity File'),
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
      label: t('connections.form.ssh.passphrase', 'SSH Passphrase'),
      type: 'password',
      optional: true,
      value: sshTunnelOptions?.identityKeyPassphrase,
      errorMessage: undefined,
      state: 'none',
    },
  ];

  return (
    <>
      {fields.map((field) => {
        const { name, label, optional, value, errorMessage, state } = field;

        switch (field.type) {
          case 'file':
            return (
              <FormFieldContainer key={name}>
                <FilePickerDialog
                  id={name}
                  dataTestId={name}
                  onChange={(files: string[]) => {
                    formFieldChanged(name, files[0]);
                  }}
                  mode="open"
                  label={label}
                  error={Boolean(errorMessage)}
                  errorMessage={errorMessage}
                  values={value as string[] | undefined}
                />
              </FormFieldContainer>
            );
          case 'text':
          case 'password':
          case 'number':
            return (
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
                  type={field.type}
                  optional={optional}
                  value={value as string | undefined}
                  errorMessage={errorMessage}
                  state={state}
                  spellCheck={false}
                />
              </FormFieldContainer>
            );
        }
      })}
    </>
  );
}

export default SshTunnelIdentity;
