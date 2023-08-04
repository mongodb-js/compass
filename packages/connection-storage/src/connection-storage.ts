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
  throwIfAborted,
} from './utils';
import { ipcExpose, ipcInvoke } from '@mongodb-js/compass-utils';

const { log, mongoLogId } = createLoggerAndTelemetry('CONNECTION-STORAGE');

type MethodProps<
  IsMainProcess extends boolean,
  Args extends Record<string, unknown>
> = IsMainProcess extends true
  ? Args & {
      signal?: AbortSignal;
    }
  : Args;

// The interface of the ConnectionStorage that's common between both
// main and renderer process. When ConnectionStorage is triggered from
// renderer process, we pass in the signal to the methods in ipcInvoke.
interface ConnectionStorage<T extends boolean> {
  loadAll(
    options: MethodProps<T, Record<string, never>>
  ): Promise<ConnectionInfo[]>;
  load(
    options: MethodProps<T, { id?: string }>
  ): Promise<ConnectionInfo | undefined>;
  hasLegacyConnections(
    options: MethodProps<T, Record<string, never>>
  ): Promise<boolean>;
  save(
    options: MethodProps<T, { connectionInfo: ConnectionInfo }>
  ): Promise<void>;
  delete(options: MethodProps<T, { id?: string }>): Promise<void>;
}

export class ConnectionStorageMain implements ConnectionStorage<true> {
  private readonly path!: string;
  private readonly folder = 'Connections';
  private readonly maxAllowedRecentConnections = 10;
  private readonly keytarServiceName = getKeytarServiceName();

  private static instance: ConnectionStorageMain | null;

  constructor(path = '') {
    if (ConnectionStorageMain.instance) {
      return ConnectionStorageMain.instance;
    }
    this.path = path;
    ConnectionStorageMain.instance = this;
  }

  static init(path?: string) {
    if (this.instance) {
      return;
    }
    const instance = new this(path);
    ipcExpose('ConnectionStorage', instance, [
      'loadAll',
      'load',
      'hasLegacyConnections',
      'save',
      'delete',
    ]);
    this.instance = instance;
  }

  private getFolderPath() {
    return join(this.path, this.folder);
  }

  private getFilePath(id: string) {
    return join(this.getFolderPath(), `${id}.json`);
  }

  private mapStoredConnectionToConnectionInfo(
    storedConnectionInfo: ConnectionInfo,
    secrets?: ConnectionSecrets
  ): ConnectionInfo {
    const connectionInfo = mergeSecrets(storedConnectionInfo, secrets);
    if (connectionInfo.lastUsed) {
      connectionInfo.lastUsed = new Date(connectionInfo.lastUsed);
    }
    return deleteCompassAppNameParam(connectionInfo);
  }

  private async getKeytarCredentials() {
    if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
      return {};
    }
    try {
      const credentials = await keytar.findCredentials(this.keytarServiceName);
      return Object.fromEntries(
        credentials.map(({ account, password }) => [
          account,
          JSON.parse(password).secrets ?? {},
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

  private async getConnections(): Promise<any[]> {
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
  async hasLegacyConnections({
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

  async loadAll({
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

  async save({
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
            this.keytarServiceName,
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

  async delete({
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
        await keytar.deletePassword(this.keytarServiceName, id);
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

  async load({
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

export class ConnectionStorageRenderer implements ConnectionStorage<false> {
  private ipc = ipcInvoke<
    ConnectionStorage<false>,
    'loadAll' | 'load' | 'hasLegacyConnections' | 'save' | 'delete'
  >('ConnectionStorage', [
    'loadAll',
    'load',
    'hasLegacyConnections',
    'save',
    'delete',
  ]);

  loadAll = this.ipc.loadAll;
  load = this.ipc.load;
  hasLegacyConnections = this.ipc.hasLegacyConnections;
  save = this.ipc.save;
  delete = this.ipc.delete;
}
