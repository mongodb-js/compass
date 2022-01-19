import { ConnectionOptions } from 'mongodb-data-service';
import { defaultSshPort } from '../constants/default-connection';

export type SSHConnectionOptions = NonNullable<ConnectionOptions['sshTunnel']>;

export type SSHType = 'none' | 'password' | 'identity' | 'socks';

export interface UpdateSshOptions {
  type: 'update-ssh-options';
  currentTab: SSHType;
  key: keyof SSHConnectionOptions;
  value: string | number;
}

export function handleUpdateSshOptions({
  action,
  connectionOptions,
}: {
  action: UpdateSshOptions;
  connectionOptions: ConnectionOptions;
}): { connectionOptions: ConnectionOptions } {
  const { key, value, currentTab } = action;

  if (currentTab === 'none') {
    return {
      connectionOptions: {
        ...connectionOptions,
        sshTunnel: undefined,
      },
    };
  }

  return {
    connectionOptions: {
      ...connectionOptions,
      sshTunnel: {
        host: '',
        port: defaultSshPort,
        username: '',
        ...connectionOptions.sshTunnel,
        [key]: value,
      },
    },
  };
}
