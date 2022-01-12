import { ConnectionOptions } from 'mongodb-data-service';
import { ConnectFormState } from '../hooks/use-connect-form';

export type SSHConnectionOptions = NonNullable<ConnectionOptions['sshTunnel']>;

export type SSHType = 'none' | 'password' | 'identity' | 'socks';

export interface UpdateSshOptions {
  type: 'update-ssh-options';
  currentTab: SSHType;
  key: keyof SSHConnectionOptions;
  value: string | number;
}

export function handleUpdateSshOptions(
  action: UpdateSshOptions,
  {
    connectionStringUrl,
    connectionOptions,
    connectionStringInvalidError,
    warnings,
  }: ConnectFormState
): ConnectFormState {
  const { key, value, currentTab } = action;

  if (currentTab === 'none') {
    return {
      connectionStringUrl,
      connectionOptions: {
        connectionString: connectionStringUrl.toString(),
      },
      errors: [],
      warnings,
      connectionStringInvalidError,
    };
  }

  if (!connectionOptions.sshTunnel) {
    connectionOptions.sshTunnel = {} as SSHConnectionOptions;
  }

  const response: ConnectFormState = {
    connectionStringUrl,
    connectionOptions: {
      ...connectionOptions,
      sshTunnel: {
        ...connectionOptions.sshTunnel,
        [key]: value,
      },
      connectionString: connectionStringUrl.toString(),
    },
    errors: [],
    warnings,
    connectionStringInvalidError,
  };

  return response;
}
