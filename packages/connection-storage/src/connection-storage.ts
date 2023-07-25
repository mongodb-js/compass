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
import { getKeytarServiceName, deleteCompassAppNameParam } from './utils';

const { log, mongoLogId } = createLoggerAndTelemetry('CONNECTION-STORAGE');

export class ConnectionStorage {
  private readonly folder = 'Connections';
  private readonly keytarServiceName: string;

  constructor(protected readonly path: string = '') {
    this.keytarServiceName = getKeytarServiceName();
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
    const credentials = await keytar.findCredentials(this.keytarServiceName);
    return Object.fromEntries(
      credentials.map(({ account, password }) => [
        account,
        JSON.parse(password).secrets ?? {},
      ])
    ) as Record<string, ConnectionSecrets>;
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

  async hasLegacyConnections() {
    return (
      (await this.getConnections()).filter((x) => !x.connectionInfo).length > 0
    );
  }

  async loadAll(): Promise<ConnectionInfo[]> {
    // Ensure folder exists
    await fs.mkdir(this.getFolderPath(), { recursive: true });

    try {
      const connections = (await this.getConnections())
        // Ignore legacy connections and make sure connection has a connection string.
        .filter(
          (x: { connectionInfo?: ConnectionInfo }) =>
            x.connectionInfo?.connectionOptions?.connectionString
        )
        .map((x) => x.connectionInfo) as ConnectionInfo[];

      if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true') {
        return connections.map((connection) =>
          this.mapStoredConnectionToConnectionInfo(connection)
        );
      }

      const secrets = await this.getKeytarCredentials();
      return connections.map((connection) =>
        this.mapStoredConnectionToConnectionInfo(
          connection,
          secrets[connection.id]
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
        return await fs.writeFile(
          this.getFilePath(connectionInfo.id),
          JSON.stringify({ connectionInfo }, null, 2),
          'utf-8'
        );
      }
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
      await keytar.setPassword(
        this.keytarServiceName,
        connectionInfo.id,
        JSON.stringify({ secrets }, null, 2)
      );
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
      await keytar.deletePassword(this.keytarServiceName, id);
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
}
