import { join } from 'path';
import { validate as uuidValidate } from 'uuid';
import fs from 'fs/promises';
import type { ConnectionInfo } from './connection-info';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import {
  type ConnectionSecrets,
  mergeSecrets,
  extractSecrets,
} from './connection-secrets';
import { deleteCompassAppNameParam } from './utils';
import { ipcInvoke } from '@mongodb-js/compass-utils';
import type { KeytarService } from './keytar-service';

const { log, mongoLogId } = createLoggerAndTelemetry('CONNECTION-STORAGE');

export class ConnectionStorage {
  private readonly folder = 'Connections';
  private readonly maxAllowedRecentConnections = 10;
  private readonly keytarIpc = ipcInvoke<
    typeof KeytarService,
    'findPasswords' | 'setPassword' | 'deletePassword'
  >('KeytarService', ['findPasswords', 'setPassword', 'deletePassword']);

  constructor(protected readonly path: string = '') {}

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
  async hasLegacyConnections() {
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

  async loadAll(): Promise<ConnectionInfo[]> {
    // Ensure folder exists
    await fs.mkdir(this.getFolderPath(), { recursive: true });

    try {
      const [connections, secrets] = await Promise.all([
        this.getConnections(),
        this.keytarIpc.findPasswords(),
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

  async save(connectionInfo: ConnectionInfo): Promise<void> {
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
        await this.keytarIpc.setPassword({
          accountId: connectionInfo.id,
          password: JSON.stringify({ secrets }, null, 2),
        });
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

  async delete(id?: string): Promise<void> {
    if (!id) {
      return;
    }

    try {
      await fs.unlink(this.getFilePath(id));
      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        return;
      }
      await this.keytarIpc.deletePassword({ accountId: id });
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

  async load(id?: string): Promise<ConnectionInfo | undefined> {
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
      void this.delete(recentConnections[recentConnections.length - 1].id);
    }
  }
}
