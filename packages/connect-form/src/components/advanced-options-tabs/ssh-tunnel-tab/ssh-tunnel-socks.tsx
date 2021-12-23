import React, { ChangeEvent } from 'react';
import { ConnectionOptions } from 'mongodb-data-service';
import { css } from '@emotion/css';
import { TextInput, spacing } from '@mongodb-js/compass-components';
import { SSHConnectionOptions } from '../../../utils/connection-options-handler';
import { defaultSocksPort } from '../../../constants/default-connection';

const inputFieldStyles = css({
  width: '50%',
  marginBottom: spacing[3],
});

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
  sshTunnelOptions: ConnectionOptions['sshTunnel'];
  onConnectionOptionChanged: (
    key: SocksFormKeys,
    value: string | number
  ) => void;
  errors?: SocksFormErrors;
}): React.ReactElement {
  const formFieldChanged = (key: SocksFormKeys, value: string | number) => {
    onConnectionOptionChanged(key, value);
  };
  return (
    <>
      <TextInput
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          formFieldChanged('host', event.target.value);
        }}
        className={inputFieldStyles}
        key={'host'}
        label={'Proxy Hostname'}
        type={'text'}
        optional={false}
        placeholder={'Proxy Hostname'}
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
        label={'Proxy Tunnel Port'}
        type={'number'}
        optional={false}
        placeholder={'Proxy Tunnel Port'}
        value={(sshTunnelOptions?.port ?? defaultSocksPort).toString()}
        errorMessage={errors?.port}
        state={errors?.port ? 'error' : 'none'}
      />
      <TextInput
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          formFieldChanged('username', event.target.value);
        }}
        className={inputFieldStyles}
        key={'username'}
        label={'Proxy Username'}
        type={'text'}
        optional={false}
        placeholder={'Proxy Username'}
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
        label={'Proxy Password'}
        type={'text'}
        optional={true}
        placeholder={'Proxy Password'}
        value={sshTunnelOptions?.password}
        errorMessage={errors?.password}
        state={errors?.password ? 'error' : 'none'}
      />
    </>
  );
}

export default Socks;
