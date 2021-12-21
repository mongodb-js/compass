import { ConnectionOptions } from 'mongodb-data-service';
import React, { ChangeEvent } from 'react';
import { css } from '@emotion/css';
import { TextInput, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  marginTop: spacing[4],
});
const inputFieldStyles = css({
  width: '50%',
  marginBottom: spacing[3],
});

function Password({
  sshTunnelOptions,
  onConnectionOptionChanged,
  errors = {},
}: {
  sshTunnelOptions: ConnectionOptions['sshTunnel'];
  onConnectionOptionChanged: (key: string, value: string | number) => void;
  errors?: { [key: string]: string };
}): React.ReactElement {
  const formFieldChanged = (key: string, value: string | number) => {
    onConnectionOptionChanged(key, value);
  };

  return (
    <div className={containerStyles}>
      <TextInput
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          formFieldChanged('host', event.target.value);
        }}
        className={inputFieldStyles}
        key={'host'}
        label={'SSH Hostname'}
        type={'text'}
        optional={false}
        placeholder={'SSH Hostname'}
        value={sshTunnelOptions?.host}
        errorMessage={errors?.host}
        state={errors?.host ? 'error' : 'none'}
      />
      <TextInput
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          formFieldChanged('port', Number(event.target.value));
        }}
        className={inputFieldStyles}
        key={'port'}
        label={'SSH Port'}
        type={'number'}
        optional={false}
        placeholder={'SSH Port'}
        value={(sshTunnelOptions?.port ?? 22).toString()}
        errorMessage={errors?.port}
        state={errors?.port ? 'error' : 'none'}
      />
      <TextInput
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          formFieldChanged('username', event.target.value);
        }}
        className={inputFieldStyles}
        key={'username'}
        label={'SSH Username'}
        type={'text'}
        optional={false}
        placeholder={'SSH Username'}
        value={sshTunnelOptions?.username}
        errorMessage={errors?.username}
        state={errors?.username ? 'error' : 'none'}
      />
      <TextInput
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          formFieldChanged('password', event.target.value);
        }}
        className={inputFieldStyles}
        key={'password'}
        label={'SSH Password'}
        type={'text'}
        optional={true}
        placeholder={'SSH Password'}
        value={sshTunnelOptions?.password}
        errorMessage={errors?.password}
        state={errors?.password ? 'error' : 'none'}
      />
    </div>
  );
}

export default Password;
