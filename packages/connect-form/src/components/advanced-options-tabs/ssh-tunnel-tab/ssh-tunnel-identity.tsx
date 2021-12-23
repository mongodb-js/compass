import React, { ChangeEvent } from 'react';
import { css, cx } from '@emotion/css';
import {
  TextInput,
  FileInput,
} from '@mongodb-js/compass-components';
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
          label={'SSH Tunnel Port'}
          type={'number'}
          optional={false}
          placeholder={'SSH Tunnel Port'}
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
        <FileInput
          id={'identity-file'}
          onChange={(files: string[]) => {
            formFieldChanged('identityKeyFile', files[0]);
          }}
          label={'SSH Identity File'}
          error={Boolean(errors?.identityKeyFile)}
          errorMessage={errors?.identityKeyFile}
          values={
            sshTunnelOptions?.identityKeyFile && sshTunnelOptions.identityKeyFile
              ? [sshTunnelOptions.identityKeyFile]
              : undefined
          }
          description={'Learn More'}
          link={'https://mongodb.com'}
          className={cx(
            css({
              margin: 0,
              label: {
                textAlign: 'left',
              },
            }),
          )}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            formFieldChanged('identityKeyPassphrase', event.target.value);
          }}
          key={'identityKeyPassphrase'}
          label={'SSH Passphrase'}
          type={'text'}
          optional={true}
          placeholder={'SSH Passphrase'}
          value={sshTunnelOptions?.identityKeyPassphrase}
          errorMessage={errors?.identityKeyPassphrase}
          state={errors?.identityKeyPassphrase ? 'error' : 'none'}
        />
      </FormFieldContainer>
    </>
  );
}

export default Identity;
