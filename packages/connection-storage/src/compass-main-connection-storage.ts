import { type HadronIpcMain, ipcMain } from 'hadron-ipc';
import { safeStorage } from 'electron';
import fsPromises from 'fs/promises';
import ConnectionString from 'mongodb-connection-string-url';

import type {
  ConnectionInfo,
  ConnectionSecrets,
} from '@mongodb-js/connection-info';
import { createLogger } from '@mongodb-js/compass-logging';
import { mergeSecrets, extractSecrets } from '@mongodb-js/connection-info';
import { deleteCompassAppNameParam } from './utils';
import { throwIfAborted } from '@mongodb-js/compass-utils';
import {
  serializeConnections,
  deserializeConnections,
} from './import-export-connection';
import type {
  ImportConnectionOptions,
  ExportConnectionOptions,
} from './import-export-connection';
import { FileUserData, z } from '@mongodb-js/compass-user-data';
import type {
  ConnectionStorage,
  AutoConnectPreferences,
} from './connection-storage';

const { log, mongoLogId } = createLogger('CONNECTION-STORAGE');

export type ConnectionStorageIPCMain = Pick<HadronIpcMain, 'createHandle'>;

type ConnectionStorageIPCInterface = Required<
  Omit<ConnectionStorage, 'on' | 'off' | 'emit'>
>;

type ConnectionLegacyProps = {
  _id?: string;
  isFavorite?: boolean;
  name?: string;
};

type ConnectionProps = {
  connectionInfo?: ConnectionInfo;
  version?: number;
  connectionSecrets?: string;
};

export type ConnectionWithLegacyProps = ConnectionProps & ConnectionLegacyProps;

const ConnectionSchema: z.Schema<ConnectionWithLegacyProps> = z
  .object({
    _id: z.string().uuid().optional(),
    isFavorite: z.boolean().optional(),
    name: z.string().optional(),
    connectionInfo: z
      .object({
        id: z.string().uuid(),
        lastUsed: z.coerce
          .date()
          .optional()
          .transform((x) => (x !== undefined ? new Date(x) : x)),
        favorite: z.any().optional(),
        savedConnectionType: z.enum(['favorite', 'recent']).optional(),
        connectionOptions: z.object({
          connectionString: z
            .string()
            .nonempty('Connection string is required.'),
          sshTunnel: z.any().optional(),
          useSystemCA: z.boolean().optional(), // Unused but may be present in legacy files
          oidc: z.any().optional(),
          fleOptions: z.any().optional(),
          useApplicationLevelProxy: z.boolean().optional(),
        }),
      })
      .optional(),
    version: z.number().optional(),
    connectionSecrets: z.string().optional(),
  })
  .passthrough();

class CompassMainConnectionStorage implements ConnectionStorage {
  private readonly userData: FileUserData<typeof ConnectionSchema>;

  private readonly version = 1;
  private readonly maxAllowedRecentConnections = 10;
  private readonly ipcMain: ConnectionStorageIPCMain;
  constructor(ipcMain: ConnectionStorageIPCMain, basePath?: string) {
    this.ipcMain = ipcMain;
    this.userData = new FileUserData(ConnectionSchema, 'Connections', {
      basePath,
    });
    this.ipcMain.createHandle<ConnectionStorageIPCInterface>(
      'ConnectionStorage',
      this,
      [
        'loadAll',
        'load',
        'save',
        'delete',
        'getAutoConnectInfo',
        'deserializeConnections',
        'exportConnections',
        'importConnections',
      ]
    );
  }

  async loadAll({ signal }: { signal?: AbortSignal } = {}): Promise<
    ConnectionInfo[]
  > {
    throwIfAborted(signal);
    try {
      const connections = await this.getConnections();
      const loadedConnections = connections
        // Ignore legacy connections and make sure connection has a connection string.
        .filter((x) => {
          return x.connectionInfo?.connectionOptions?.connectionString;
        })
        .map((connection) =>
          this.mapStoredConnectionToConnectionInfo(connection)
        );
      return loadedConnections;
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_101),
        'Connection Storage',
        'Failed to load connections',
        { message: (err as Error).message }
      );
      return [];
    }
  }

  async load({
    id,
    signal,
  }: {
    id: string;
    signal?: AbortSignal;
  }): Promise<ConnectionInfo | undefined> {
    throwIfAborted(signal);
    if (!id) {
      return undefined;
    }
    const connections = await this.loadAll();
    return connections.find((connection) => id === connection.id);
  }

  async save({
    connectionInfo,
    signal,
  }: {
    connectionInfo: ConnectionInfo;
    signal?: AbortSignal;
  }): Promise<void> {
    throwIfAborted(signal);
    try {
      const { secrets, connectionInfo: connectionInfoWithoutSecrets } =
        extractSecrets(connectionInfo);

      let connectionSecrets: string | undefined = undefined;
      try {
        connectionSecrets = this.encryptSecrets(secrets);
      } catch (e) {
        log.error(
          mongoLogId(1_001_000_202),
          'Connection Storage',
          'Failed to encrypt secrets',
          { message: (e as Error).message }
        );
      }
      await this.userData.write(connectionInfo.id, {
        _id: connectionInfo.id,
        connectionInfo: connectionInfoWithoutSecrets,
        connectionSecrets,
        version: this.version,
      });
      await this.afterConnectionHasBeenSaved(connectionInfo);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_103),
        'Connection Storage',
        'Failed to save connection',
        { message: (err as Error).message }
      );

      throw err;
    }
  }

  async delete({
    id,
    signal,
  }: {
    id: string;
    signal?: AbortSignal;
  }): Promise<void> {
    throwIfAborted(signal);
    if (!id) {
      return;
    }
    try {
      await this.userData.delete(id);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_104),
        'Connection Storage',
        'Failed to delete connection',
        { message: (err as Error).message }
      );

      throw err;
    }
  }

  async getAutoConnectInfo(
    autoConnectPreferences: AutoConnectPreferences,
    fs: Pick<typeof fsPromises, 'readFile'> = fsPromises
  ): Promise<ConnectionInfo | undefined> {
    const {
      file,
      positionalArguments = [],
      passphrase,
      username,
      password,
      shouldAutoConnect,
    } = autoConnectPreferences;

    if (!shouldAutoConnect) return undefined;

    const getConnectionStringFromArgs = (args?: string[]) => args?.[0];

    const applyUsernameAndPassword = (
      connectionInfo: Readonly<ConnectionInfo>,
      {
        username,
        password,
      }: Pick<AutoConnectPreferences, 'username' | 'password'>
    ): ConnectionInfo => {
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
    };

    if (file) {
      const fileContents = await fs.readFile(file, 'utf8');
      const connections = await this.deserializeConnections({
        content: fileContents,
        options: {
          trackingProps: { context: 'Autoconnect' },
          passphrase,
        },
      });
      let id: string | undefined;
      if (positionalArguments.length > 0) {
        id = getConnectionStringFromArgs(positionalArguments);
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
      return applyUsernameAndPassword(connectionInfo, {
        username,
        password,
      });
    } else {
      // Assuming the positional argument refers to an existing connection id
      if (positionalArguments.length === 1) {
        // Attempt to load it and return if found
        const possibleConnection = await this.load({
          id: positionalArguments[0],
        });
        if (possibleConnection) {
          return possibleConnection;
        }
      }
      // Determine if this is a valid connection string or a connection ID
      const connectionString = getConnectionStringFromArgs(positionalArguments);
      if (!connectionString) {
        throw new Error('Could not find a connection string');
      }
      return applyUsernameAndPassword(
        {
          connectionOptions: { connectionString },
          // Same connection id if we're not loading it from disk where id
          // should exist already either in file or positional args
          id: 'autoconnection',
        },
        { username, password }
      );
    }
  }

  async deserializeConnections({
    content,
    options = {},
    signal,
  }: {
    content: string;
    options: ImportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<ConnectionInfo[]> {
    throwIfAborted(signal);

    const { passphrase, trackingProps, filterConnectionIds } = options;
    const connections = await deserializeConnections(content, {
      passphrase,
      trackingProps,
    });
    return filterConnectionIds
      ? connections.filter((x) => filterConnectionIds.includes(x.id))
      : connections;
  }

  async importConnections({
    content,
    options = {},
    signal,
  }: {
    content: string;
    options?: ImportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<void> {
    throwIfAborted(signal);

    const connections = await this.deserializeConnections({
      content,
      options,
      signal,
    });

    log.info(
      mongoLogId(1_001_000_149),
      'Connection Import',
      'Starting connection import',
      {
        count: connections.length,
      }
    );

    await Promise.all(
      connections.map((connectionInfo) => this.save({ connectionInfo, signal }))
    );

    log.info(
      mongoLogId(1_001_000_150),
      'Connection Import',
      'Connection import complete',
      {
        count: connections.length,
      }
    );
  }

  async exportConnections({
    options = {},
    signal,
  }: {
    options?: ExportConnectionOptions;
    signal?: AbortSignal;
  } = {}): Promise<string> {
    throwIfAborted(signal);

    const { filterConnectionIds, ...restOfOptions } = options;
    const connections = await this.loadAll({ signal });
    const exportConnections = filterConnectionIds
      ? connections.filter((x) => filterConnectionIds.includes(x.id))
      : connections.filter((x) => x.favorite?.name);

    return serializeConnections(exportConnections, restOfOptions);
  }

  private async getConnections(): Promise<ConnectionWithLegacyProps[]> {
    return (await this.userData.readAll()).data;
  }

  private mapStoredConnectionToConnectionInfo({
    connectionInfo: storedConnectionInfo,
    connectionSecrets: storedConnectionSecrets,
  }: ConnectionProps): ConnectionInfo {
    let secrets: ConnectionSecrets | undefined = undefined;
    try {
      secrets = this.decryptSecrets(storedConnectionSecrets);
    } catch (e) {
      log.error(
        mongoLogId(1_001_000_208),
        'Connection Storage',
        'Failed to decrypt secrets',
        { message: (e as Error).message }
      );
    }
    let connectionInfo = mergeSecrets(storedConnectionInfo!, secrets);
    connectionInfo = this.migrateSavedConnectionType(connectionInfo);
    return deleteCompassAppNameParam(connectionInfo);
  }

  private encryptSecrets(secrets?: ConnectionSecrets): string | undefined {
    return Object.keys(secrets ?? {}).length > 0
      ? safeStorage.encryptString(JSON.stringify(secrets)).toString('base64')
      : undefined;
  }

  private decryptSecrets(secrets?: string): ConnectionSecrets | undefined {
    return secrets
      ? JSON.parse(safeStorage.decryptString(Buffer.from(secrets, 'base64')))
      : undefined;
  }

  private migrateSavedConnectionType(
    connectionInfo: ConnectionInfo
  ): ConnectionInfo {
    const inferedConnectionType = connectionInfo.favorite
      ? 'favorite'
      : 'recent';

    return {
      ...connectionInfo,
      savedConnectionType: connectionInfo.savedConnectionType
        ? connectionInfo.savedConnectionType
        : inferedConnectionType,
    };
  }

  private async afterConnectionHasBeenSaved(
    savedConnection: ConnectionInfo
  ): Promise<void> {
    if (savedConnection.favorite) {
      return;
    }

    const recentConnections = (await this.loadAll())
      // remove favorites and the just saved connection (so we do not delete it)
      .filter((x) => !x.favorite && x.id !== savedConnection.id)
      .sort((a, b) => {
        const aTime = a.lastUsed?.getTime() ?? 0;
        const bTime = b.lastUsed?.getTime() ?? 0;
        return bTime - aTime;
      });

    if (recentConnections.length >= this.maxAllowedRecentConnections) {
      await this.delete({
        id: recentConnections[recentConnections.length - 1].id,
      });
    }
  }
}

export type { CompassMainConnectionStorage };

let mainConnectionStorage: CompassMainConnectionStorage | null = null;

export const initCompassMainConnectionStorage = (
  basePath?: string,
  __TEST_IPC_MAIN?: ConnectionStorageIPCMain,
  __TEST_IGNORE_SINGLETON?: boolean
): CompassMainConnectionStorage => {
  let ipcMainToBeUsed: ConnectionStorageIPCMain | undefined = ipcMain;
  if (process.env.NODE_ENV === 'test' && __TEST_IPC_MAIN) {
    ipcMainToBeUsed = __TEST_IPC_MAIN;
  }

  if (!ipcMainToBeUsed) {
    throw new Error(
      'Cannot initialize CompassConnectionStorage outside of main process'
    );
  }

  if (!mainConnectionStorage || __TEST_IGNORE_SINGLETON) {
    mainConnectionStorage = new CompassMainConnectionStorage(
      ipcMainToBeUsed,
      basePath
    );
  }

  return mainConnectionStorage;
};

export const getCompassMainConnectionStorage =
  (): CompassMainConnectionStorage => {
    if (!mainConnectionStorage) {
      throw new Error(
        'ConnectionStorage not initialized, did you forget to call initCompassConnectionStorage'
      );
    }
    return mainConnectionStorage;
  };
