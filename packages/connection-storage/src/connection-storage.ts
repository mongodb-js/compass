import { join } from 'path';
import { validate as uuidValidate } from 'uuid';
import fs from 'fs/promises';
import keytar from 'keytar';

import type { ConnectionInfo } from './connection-info';
import { convertConnectionInfoToModel } from './legacy/legacy-connection-model';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { type ConnectionSecrets, mergeSecrets } from './connection-secrets';
import { getKeytarServiceName, deleteCompassAppNameParam } from './utils';

const { log, mongoLogId } = createLoggerAndTelemetry('CONNECTION-STORAGE');

export class ConnectionStorage {
  private readonly folder = 'Connections';
  private readonly keytarService: string;

  constructor(protected readonly path: string = '') {
    this.keytarService = getKeytarServiceName();
  }

  private getFolderPath() {
    return join(this.path, this.folder);
  }

  private getFilePath(id: string) {
    return join(this.getFolderPath(), `${id}.json`);
  }

  private mapStoredConnectionToConnectionInfo(
    storeConnectionInfo: ConnectionInfo,
    secrets: ConnectionSecrets
  ): ConnectionInfo {
    const connectionInfo = mergeSecrets(storeConnectionInfo, secrets);
    if (connectionInfo.lastUsed) {
      // could be parsed from json and be a string
      connectionInfo.lastUsed = new Date(connectionInfo.lastUsed);
    }
    return deleteCompassAppNameParam(connectionInfo);
  }

  async loadAll(): Promise<ConnectionInfo[]> {
    // Ensure folder exists
    await fs.mkdir(this.getFolderPath(), { recursive: true });

    const connectionIds = (await fs.readdir(this.getFolderPath()))
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''))
      .filter(Boolean) as string[];

    try {
      const data = await Promise.all(connectionIds.map(this.load.bind(this)));
      return data.filter(Boolean) as ConnectionInfo[];
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

  async load(id?: string): Promise<ConnectionInfo | undefined> {
    if (!id) {
      return undefined;
    }
    try {
      const connection = JSON.parse(
        await fs.readFile(this.getFilePath(id), 'utf8')
      );
      const password = await keytar.getPassword(this.keytarService, id);
      const secrets = password ? JSON.parse(password).secrets : {};
      return this.mapStoredConnectionToConnectionInfo(
        connection.connectionInfo,
        secrets
      );
    } catch (e) {
      log.error(
        mongoLogId(1_001_000_102),
        'Connection Storage',
        'Failed to load connection',
        { message: (e as Error).message }
      );
      return undefined;
    }
  }

  /**
   * Inserts or replaces a ConnectionInfo object in the storage.
   *
   * The ConnectionInfo object must have an id set to a string
   * matching the uuid format.
   *
   * @param connectionInfo - The ConnectionInfo object to be saved.
   */
  async save(connectionInfo: ConnectionInfo): Promise<void> {
    try {
      if (!connectionInfo.id) {
        throw new Error('id is required');
      }

      if (!uuidValidate(connectionInfo.id)) {
        throw new Error('id must be a uuid');
      }

      const model = await convertConnectionInfoToModel(connectionInfo);
      await new Promise((resolve, reject) => {
        model.save(undefined, {
          success: resolve,
          error: reject,
          validate: false,
        });
      });
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
      await keytar.deletePassword(this.keytarService, id);
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
}
