import { ConnectionStorage } from '@mongodb-js/connection-storage/renderer';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { promises as fsPromises } from 'fs';
import { UUID } from 'bson';
import { ipcRenderer } from 'hadron-ipc';
import { ConnectionString } from 'mongodb-connection-string-url';
import type { AutoConnectPreferences } from '../main/auto-connect';

async function getWindowAutoConnectPreferences(): Promise<AutoConnectPreferences> {
  return await ipcRenderer?.call('compass:get-window-auto-connect-preferences');
}

function applyUsernameAndPassword(
  connectionInfo: Readonly<ConnectionInfo>,
  { username, password }: Pick<AutoConnectPreferences, 'username' | 'password'>
): ConnectionInfo {
  const connectionString = new ConnectionString(
    connectionInfo.connectionOptions.connectionString
  );
  if (username) connectionString.username = encodeURIComponent(username);
  if (password) connectionString.password = encodeURIComponent(password);
  return {
    ...connectionInfo,
    connectionOptions: {
      ...connectionInfo.connectionOptions,
      connectionString: connectionString.toString(),
    },
  };
}

export async function loadAutoConnectInfo(
  getPreferences: () => Promise<AutoConnectPreferences> = getWindowAutoConnectPreferences,
  fs: Pick<typeof fsPromises, 'readFile'> = fsPromises,
  deserializeConnections = ConnectionStorage.deserializeConnections.bind(
    ConnectionStorage
  )
): Promise<undefined | (() => Promise<ConnectionInfo | undefined>)> {
  const autoConnectPreferences = await getPreferences();
  const {
    file,
    positionalArguments = [],
    passphrase,
    username,
    password,
    shouldAutoConnect,
  } = autoConnectPreferences;
  if (!shouldAutoConnect) return;

  // Return an async function here rather than just loading the ConnectionInfo so that errors
  // from importing the connection end up being treated like connection failures.
  return async (): Promise<ConnectionInfo | undefined> => {
    if (file) {
      const fileContents = await fs.readFile(file, 'utf8');
      const connections = await deserializeConnections({
        content: fileContents,
        options: {
          trackingProps: { context: 'Autoconnect' },
          passphrase,
        },
      });
      let id: string | undefined;
      if (positionalArguments.length > 0) {
        id = positionalArguments[0];
      } else if (connections.length === 1) {
        id = connections[0].id;
      }
      if (!id) {
        throw new Error(
          `No connection id specified and connection file '${file}' contained ${connections.length} entries`
        );
      }
      const connectionInfo = connections.find((c) => c.id === id);
      if (!connectionInfo) {
        throw new Error(
          `Could not find connection with id '${id}' in connection file '${file}'`
        );
      }
      return applyUsernameAndPassword(connectionInfo, { username, password });
    } else {
      return applyUsernameAndPassword(
        {
          connectionOptions: {
            connectionString: positionalArguments[0],
          },
          id: new UUID().toString(),
        },
        { username, password }
      );
    }
  };
}
