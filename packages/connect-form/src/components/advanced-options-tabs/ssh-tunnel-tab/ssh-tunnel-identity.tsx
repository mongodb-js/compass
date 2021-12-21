import { ConnectionOptions } from 'mongodb-data-service';
import React, { ChangeEvent } from 'react';
import { css, cx } from '@emotion/css';
import { TextInput, FileInput, spacing, Icon } from '@mongodb-js/compass-components';
import { SSHConnectionOptions } from '../../../hooks/use-connect-form';
import { defaultSSHPort } from '../../../constants/default-connection';

const inputFieldStyles = css({
  width: '50%',
  marginBottom: spacing[3],
});
const fileHelpStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'start',
  alignItems: 'center',
});

type IdentityFormKeys = keyof SSHConnectionOptions;
type IdentityFormErrors = {
  [key in IdentityFormKeys]?: string;
}

function Identity({
  sshTunnelOptions,
  onConnectionOptionChanged,
  errors,
}: {
  sshTunnelOptions: ConnectionOptions['sshTunnel'];
  onConnectionOptionChanged: (key: IdentityFormKeys, value: string | number) => void;
  errors?: IdentityFormErrors;
}): React.ReactElement {
  const formFieldChanged = (key: IdentityFormKeys, value: string | number) => {
    onConnectionOptionChanged(key, value);
  }
  return (
    <>
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
        label={'SSH Tunnel Port'}
        type={'number'}
        optional={false}
        placeholder={'SSH Tunnel Port'}
        value={(sshTunnelOptions?.port ?? defaultSSHPort).toString()}
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
      <FileInput
        onChange={(files: string[]) => {
          formFieldChanged('identityKeyFile', files[0]);
        }}
        label={'SSH Identity File'}
        error={Boolean(errors?.identityKeyFile)}
        values={
          sshTunnelOptions?.identityKeyFile && sshTunnelOptions.identityKeyFile
          ? [sshTunnelOptions.identityKeyFile]
          : undefined
        }
        helpText={(
          <div className={fileHelpStyles}>
            <a href="https://mongodb.com">Learn More</a>
            <Icon glyph="OpenNewTab" />
          </div>
        )}
        className={cx(
          css({
            margin: 0,
            label: {
              textAlign: 'left',
            },
          }),
          inputFieldStyles,
        )}
      />
      <TextInput
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          formFieldChanged('identityKeyPassphrase', event.target.value);
        }}
        className={inputFieldStyles}
        key={'identityKeyPassphrase'}
        label={'SSH Passphrase'}
        type={'text'}
        optional={true}
        placeholder={'SSH Passphrase'}
        value={sshTunnelOptions?.identityKeyPassphrase}
        errorMessage={errors?.identityKeyPassphrase}
        state={errors?.identityKeyPassphrase ? 'error' : 'none'}
      />
    </>
  );
}

export default Identity;
