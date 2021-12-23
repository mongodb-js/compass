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

  return (
    <>
      <FormFieldContainer>
        <TextInput
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            formFieldChanged('host', event.target.value);
          }}
          key={'host'}
          label={'SSH Hostname'}
          type={'text'}
          optional={false}
          placeholder={'SSH Hostname'}
          value={sshTunnelOptions?.host}
          errorMessage={errors?.host}
          state={errors?.host ? 'error' : 'none'}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            formFieldChanged('port', Number(event.target.value));
          }}
          key={'port'}
          label={'SSH Port'}
          type={'number'}
          optional={false}
          placeholder={'SSH Port'}
          value={(sshTunnelOptions?.port ?? '').toString()}
          errorMessage={errors?.port}
          state={errors?.port ? 'error' : 'none'}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            formFieldChanged('username', event.target.value);
          }}
          key={'username'}
          label={'SSH Username'}
          type={'text'}
          optional={false}
          placeholder={'SSH Username'}
          value={sshTunnelOptions?.username}
          errorMessage={errors?.username}
          state={errors?.username ? 'error' : 'none'}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            formFieldChanged('password', event.target.value);
          }}
          key={'password'}
          label={'SSH Password'}
          type={'text'}
          optional={true}
          placeholder={'SSH Password'}
          value={sshTunnelOptions?.password}
          errorMessage={errors?.password}
          state={errors?.password ? 'error' : 'none'}
        />
      </FormFieldContainer>
    </>
  );
}

export default Password;
