import { join } from 'path';
import { validate as uuidValidate } from 'uuid';
import fs from 'fs/promises';
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
import {
  getStoragePaths,
  ipcExpose,
  throwIfAborted,
} from '@mongodb-js/compass-utils';
import {
  serializeConnections,
  deserializeConnections,
} from './import-export-connection';
import type {
  ImportConnectionOptions,
  ExportConnectionOptions,
} from './import-export-connection';

const { log, mongoLogId } = createLoggerAndTelemetry('CONNECTION-STORAGE');

export class ConnectionStorage {
  private static calledOnce: boolean;
  private static path: string;

  private static readonly folder = 'Connections';
  private static readonly maxAllowedRecentConnections = 10;

  private constructor() {
    // singleton
  }

  static init(path = getStoragePaths()?.basepath ?? '') {
    if (this.calledOnce) {
      return;
    }
    this.path = path;
    ipcExpose('ConnectionStorage', this, [
      'loadAll',
      'load',
      'hasLegacyConnections',
      'save',
      'delete',
      'deserializeConnections',
      'exportConnections',
      'importConnections',
    ]);
    this.calledOnce = true;
  }

  private static getFolderPath() {
    return join(this.path, this.folder);
  }

  private static getFilePath(id: string) {
    return join(this.getFolderPath(), `${id}.json`);
  }

  private static mapStoredConnectionToConnectionInfo(
    storedConnectionInfo: ConnectionInfo,
    secrets?: ConnectionSecrets
  ): ConnectionInfo {
    const connectionInfo = mergeSecrets(storedConnectionInfo, secrets);
    if (connectionInfo.lastUsed) {
      connectionInfo.lastUsed = new Date(connectionInfo.lastUsed);
    }
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

  private static async getConnections(): Promise<any[]> {
    const connectionIds = (await fs.readdir(this.getFolderPath()))
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));

    const data = await Promise.all(
      connectionIds.map(async (id) => {
        try {
          return JSON.parse(await fs.readFile(this.getFilePath(id), 'utf8'));
        } catch (e) {
          log.error(
            mongoLogId(1_001_000_200),
            'Connection Storage',
            'Failed to parse connection',
            { message: (e as Error).message, connectionId: id }
          );
          return undefined;
        }
      })
    );
    return data.filter(Boolean);
  }

  /**
   * We only consider favorite legacy connections and ignore
   * recent legacy connections.
   *
   * connection.connectionInfo  -> new connection
   * connection.isFavorite      -> legacy favorite connection
   */
  static async hasLegacyConnections({
    signal,
  }: {
    signal?: AbortSignal;
  } = {}): Promise<boolean> {
    throwIfAborted(signal);
    try {
      return (
        (await this.getConnections()).filter(
          (x) => !x.connectionInfo && x.isFavorite
        ).length > 0
      );
    } catch (e) {
      return false;
    }
  }

  static async loadAll({
    signal,
  }: {
    signal?: AbortSignal;
  } = {}): Promise<ConnectionInfo[]> {
    throwIfAborted(signal);
    // Ensure folder exists
    await fs.mkdir(this.getFolderPath(), { recursive: true });

    try {
      const [connections, secrets] = await Promise.all([
        this.getConnections(),
        this.getKeytarCredentials(),
      ]);
      return (
        connections
          // Ignore legacy connections and make sure connection has a connection string.
          .filter(
            (x: { connectionInfo?: ConnectionInfo }) =>
              x.connectionInfo?.connectionOptions?.connectionString
          )
          .map(({ connectionInfo }: { connectionInfo: ConnectionInfo }) =>
            this.mapStoredConnectionToConnectionInfo(
              connectionInfo,
              secrets[connectionInfo.id]
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
      if (!connectionInfo.id) {
        throw new Error('id is required');
      }

      if (!uuidValidate(connectionInfo.id)) {
        throw new Error('id must be a uuid');
      }

      if (!connectionInfo.connectionOptions.connectionString) {
        throw new Error('Connection string is required.');
      }

      // While testing, we don't use keychain to store secrets
      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        await fs.writeFile(
          this.getFilePath(connectionInfo.id),
          JSON.stringify({ connectionInfo }, null, 2),
          'utf-8'
        );
      } else {
        const { secrets, connectionInfo: connectionInfoWithoutSecrets } =
          extractSecrets(connectionInfo);
        await fs.writeFile(
          this.getFilePath(connectionInfo.id),
          JSON.stringify(
            {
              connectionInfo: connectionInfoWithoutSecrets,
            },
            null,
            2
          ),
          'utf-8'
        );
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
      await fs.unlink(this.getFilePath(id));
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
