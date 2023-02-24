import { cloneDeep } from 'lodash';
import type { ConnectionOptions } from 'mongodb-data-service';
import { defaultSshPort } from '../constants/default-connection';

export type SSHConnectionOptions = NonNullable<ConnectionOptions['sshTunnel']>;

export type TunnelType = 'none' | 'ssh-password' | 'ssh-identity' | 'socks';

export interface UpdateSshOptions {
  type: 'update-ssh-options';
  key: keyof SSHConnectionOptions;
  value: string | number | undefined;
}

export function handleUpdateSshOptions({
  action,
  connectionOptions,
}: {
  action: UpdateSshOptions;
  connectionOptions: ConnectionOptions;
}): { connectionOptions: ConnectionOptions } {
  const clonedConnectionOptions = cloneDeep(connectionOptions);
  const { key, value } = action;
  return {
    connectionOptions: {
      ...clonedConnectionOptions,
      sshTunnel: {
        host: '',
        port: defaultSshPort,
        username: '',
        ...clonedConnectionOptions.sshTunnel,
        [key]: value,
      },
    },
  };
}
