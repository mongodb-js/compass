import { ConnectionOptions } from 'mongodb-data-service';
import React from 'react';

import FormField, { IFormField } from './form-field';

function Password({
  sshTunnelOptions,
  onConnectionOptionChanged,
}: {
  sshTunnelOptions: ConnectionOptions['sshTunnel'];
  onConnectionOptionChanged: (key: string, value: string | number) => void;
}): React.ReactElement {
  const fields: IFormField[] = [
    {
      key: 'hostname',
      label: 'SSH Hostname',
      type: 'text',
      placeholder: 'SSH Hostname',
      value: sshTunnelOptions?.host,
    },
    {
      key: 'port',
      label: 'SSH Tunnel Port',
      type: 'number',
      placeholder: 'SSH Tunnel Port',
      value: sshTunnelOptions?.port,
    },
    {
      key: 'username',
      label: 'SSH Username',
      type: 'text',
      placeholder: 'SSH Username',
      value: sshTunnelOptions?.username,
    },
    {
      key: 'password',
      label: 'SSH Password',
      type: 'text',
      placeholder: 'SSH Password',
      value: sshTunnelOptions?.password,
      optional: true,
    },
  ];
  
  const formFieldChanged = (key: string, value: string | number) => {
    onConnectionOptionChanged(key, value);
  };

  return <FormField fields={fields} onFieldChanged={formFieldChanged} />;
}

export default Password;
