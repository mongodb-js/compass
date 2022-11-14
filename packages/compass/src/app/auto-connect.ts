import type { AllPreferences } from 'compass-preferences-model';
import { importConnections } from 'mongodb-data-service';
import type { ConnectionInfo } from 'mongodb-data-service';
import { promises as fsPromises } from 'fs';
import { UUID } from 'bson';
import { ipcRenderer } from 'hadron-ipc';

async function shouldWindowAutoConnect(): Promise<boolean> {
  return await ipcRenderer.call('compass:should-window-auto-connect');
}

export function loadAutoConnectInfo(
  preferences: Pick<AllPreferences, 'file' | 'positionalArguments' | 'passphrase'>,
  fs: Pick<typeof fsPromises, 'readFile'> = fsPromises
): undefined | (() => Promise<ConnectionInfo | undefined>) {
  const {
    file,
    positionalArguments = [],
    passphrase,
  } = preferences;
  // The about: accounts for webdriverio in the e2e tests appending the argument for every run
  if (!file && (!positionalArguments.length || positionalArguments.every(arg => arg.startsWith('about:')))) {
    return;
  }

  // Return an async function here rather than just loading the ConnectionInfo so that errors
  // from importing the connection end up being treated like connection failures.
  return async (): Promise<ConnectionInfo | undefined> => {
    if (!await shouldWindowAutoConnect()) {
      return undefined;
    }

    if (file) {
      const fileContents = await fs.readFile(file, 'utf8');
      const connections: ConnectionInfo[] = [];
      await importConnections(fileContents, {
        trackingProps: { context: 'Autoconnect' },
        passphrase,
        saveConnections(infos: ConnectionInfo[]) {
          connections.push(...infos);
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
      return connectionInfo;
    } else {
      return {
        connectionOptions: {
          connectionString: positionalArguments[0],
        },
        id: new UUID().toString(),
      };
    }
  };
}
