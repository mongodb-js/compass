import { ipcMain } from 'electron';
import keytar from 'keytar';

import type { ConnectionInfo } from './connection-info';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import {
  type ConnectionSecrets,
  mergeSecrets,
  extractSecrets,
} from './connection-secrets';
import {
  deleteCompassAppNameParam,
  getKeytarServiceName,
  parseStoredPassword,
} from './utils';
import { ipcExpose, throwIfAborted } from '@mongodb-js/compass-utils';
import {
  serializeConnections,
  deserializeConnections,
} from './import-export-connection';
import type {
  ImportConnectionOptions,
  ExportConnectionOptions,
} from './import-export-connection';
import { UserData } from '@mongodb-js/compass-user-data';
import { z } from 'zod';

const { log, mongoLogId } = createLoggerAndTelemetry('CONNECTION-STORAGE');

type ConnectionLegacyProps = {
  _id?: string;
  isFavorite?: boolean;
  name?: string;
};

type ConnectionWithLegacyProps = {
  connectionInfo?: ConnectionInfo;
} & ConnectionLegacyProps;

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
          .transform((x) => (x ? new Date(x) : x)),
        favorite: z.any().optional(),
        connectionOptions: z.object({
          connectionString: z
            .string()
            .nonempty('Connection string is required.'),
          sshTunnel: z.any().optional(),
          useSystemCA: z.boolean().optional(),
          oidc: z.any().optional(),
          fleOptions: z.any().optional(),
        }),
      })
      .optional(),
  })
  .passthrough();

export class ConnectionStorage {
  private static calledOnce: boolean;
  private static ipcMain: Pick<typeof ipcMain, 'handle'> = ipcMain;

  private static readonly maxAllowedRecentConnections = 10;
  private static userData: UserData<typeof ConnectionSchema>;

  private constructor() {
    // singleton
  }

  static init(basePath?: string) {
    if (this.calledOnce) {
      return;
    }
    this.userData = new UserData(() => ConnectionSchema, {
      subdir: 'Connections',
      basePath,
    });
    ipcExpose(
      'ConnectionStorage',
      this,
      [
        'loadAll',
        'load',
        'getLegacyConnections',
        'save',
        'delete',
        'deserializeConnections',
        'exportConnections',
        'importConnections',
      ],
      this.ipcMain
    );
    this.calledOnce = true;
  }

  private static mapStoredConnectionToConnectionInfo(
    storedConnectionInfo: ConnectionInfo,
    secrets?: ConnectionSecrets
  ): ConnectionInfo {
    const connectionInfo = mergeSecrets(storedConnectionInfo, secrets);
    return deleteCompassAppNameParam(connectionInfo);
  }

  private static async getKeytarCredentials() {
    if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
      return {};
    }
    try {
      const credentials = await keytar.findCredentials(getKeytarServiceName());
      return Object.fromEntries(
        credentials.map(({ account, password }) => [
          account,
          parseStoredPassword(password),
        ])
      ) as Record<string, ConnectionSecrets>;
    } catch (e) {
      log.error(
        mongoLogId(1_001_000_201),
        'Connection Storage',
        'Failed to load secrets from keychain',
        { message: (e as Error).message }
      );
      return {};
    }
  }

  private static async getConnections(): Promise<ConnectionWithLegacyProps[]> {
    return (await this.userData.readAll()).data;
  }

  /**
   * We only consider favorite legacy connections and ignore
   * recent legacy connections.
   *
   * connection.connectionInfo  -> new connection
   * connection.isFavorite      -> legacy favorite connection
   */
  static async getLegacyConnections({
    signal,
  }: {
    signal?: AbortSignal;
  } = {}): Promise<{ name: string }[]> {
    throwIfAborted(signal);
    try {
      const legacyConnections = (await this.getConnections()).filter(
        (x) => !x.connectionInfo && x.isFavorite
      );
      return legacyConnections.map((x) => ({
        name: x.name!,
      }));
    } catch (e) {
      return [];
    }
  }

  static async loadAll({
    signal,
  }: {
    signal?: AbortSignal;
  } = {}): Promise<ConnectionInfo[]> {
    throwIfAborted(signal);
    try {
      const [connections, secrets] = await Promise.all([
        this.getConnections(),
        this.getKeytarCredentials(),
      ]);
      return (
        connections
          // Ignore legacy connections and make sure connection has a connection string.
          .filter((x) => x.connectionInfo?.connectionOptions?.connectionString)
          .map(({ connectionInfo }) =>
            this.mapStoredConnectionToConnectionInfo(
              connectionInfo!,
              secrets[connectionInfo!.id]
            )
          )
      );
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

  static async save({
    connectionInfo,
    signal,
  }: {
    signal?: AbortSignal;
    connectionInfo: ConnectionInfo;
  }): Promise<void> {
    throwIfAborted(signal);
    try {
      // While saving connections, we also save `_id` property
      // in order to support the downgrade of Compass to a version
      // where we use storage-mixin. storage-mixin uses this prop
      // to map keytar credentials to the stored connection.

      // While testing, we don't use keychain to store secrets
      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        await this.userData.write(connectionInfo.id, {
          connectionInfo,
          _id: connectionInfo.id,
        });
      } else {
        const { secrets, connectionInfo: connectionInfoWithoutSecrets } =
          extractSecrets(connectionInfo);
        await this.userData.write(connectionInfo.id, {
          connectionInfo: connectionInfoWithoutSecrets,
          _id: connectionInfo.id,
        });

        try {
          await keytar.setPassword(
            getKeytarServiceName(),
            connectionInfo.id,
            JSON.stringify({ secrets }, null, 2)
          );
        } catch (e) {
          log.error(
            mongoLogId(1_001_000_202),
            'Connection Storage',
            'Failed to save secrets to keychain',
            { message: (e as Error).message }
          );
        }
      }
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

  static async delete({
    id,
    signal,
  }: {
    id?: string;
    signal?: AbortSignal;
  }): Promise<void> {
    throwIfAborted(signal);
    if (!id) {
      return;
    }

    try {
      await this.userData.delete(id);
      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        return;
      }
      try {
        await keytar.deletePassword(getKeytarServiceName(), id);
      } catch (e) {
        log.error(
          mongoLogId(1_001_000_203),
          'Connection Storage',
          'Failed to delete secrets from keychain',
          { message: (e as Error).message }
        );
      }
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

  static async load({
    id,
    signal,
  }: {
    id?: string;
    signal?: AbortSignal;
  }): Promise<ConnectionInfo | undefined> {
    throwIfAborted(signal);
    if (!id) {
      return undefined;
    }
    const connections = await this.loadAll();
    return connections.find((connection) => id === connection.id);
  }

  private static async afterConnectionHasBeenSaved(
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

  static async deserializeConnections({
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

  static async importConnections({
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

  static async exportConnections({
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
}
