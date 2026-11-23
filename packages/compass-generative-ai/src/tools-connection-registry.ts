import {
  ConnectionEntry,
  ErrorCodes,
  MongoDBError,
  type ConnectionRegistry,
} from '@mongodb-js/mcp-tools-mongodb';
import type { Keychain } from '@mongodb-js/mcp-core';
import type { NodeDriverServiceProvider } from '@mongosh/service-provider-node-driver';
import {
  COMPASS_CONNECTION_ID,
  type ToolsConnectionManager,
} from './tools-connection-manager';

/**
 * Exposes Compass's single sidebar connection to v3's `connectionId`-keyed
 * registry as {@link COMPASS_CONNECTION_ID}, without running the library's
 * connection store.
 */
export class ToolsConnectionRegistry implements ConnectionRegistry {
  private readonly entry: ConnectionEntry;

  constructor(connectionManager: ToolsConnectionManager, keychain: Keychain) {
    this.entry = new ConnectionEntry({
      connectionId: COMPASS_CONNECTION_ID,
      name: COMPASS_CONNECTION_ID,
      source: 'explicit',
      manager: connectionManager,
      keychain,
    });
  }

  createEntry(): Promise<ConnectionEntry> {
    return Promise.reject(
      new Error(
        'Database Tools in MongoDB Compass manage connections through the Compass connection sidebar'
      )
    );
  }

  connect(): Promise<ConnectionEntry> {
    return Promise.reject(
      new Error(
        'Database Tools in MongoDB Compass manage connections through the Compass connection sidebar'
      )
    );
  }

  get(connectionId: string): Promise<ConnectionEntry | undefined> {
    return Promise.resolve(
      connectionId === COMPASS_CONNECTION_ID ? this.entry : undefined
    );
  }

  peek(connectionId: string): Promise<ConnectionEntry | undefined> {
    return this.get(connectionId);
  }

  find(
    predicate?: (entry: ConnectionEntry) => boolean
  ): Promise<ConnectionEntry[]> {
    return Promise.resolve(
      predicate === undefined || predicate(this.entry) ? [this.entry] : []
    );
  }

  async resolve(connectionId: string): Promise<NodeDriverServiceProvider> {
    const entry = await this.get(connectionId);
    if (!entry) {
      throw new MongoDBError(
        ErrorCodes.UnknownConnectionId,
        `Connection "${connectionId}" does not exist or has expired.`
      );
    }
    return entry.getServiceProvider();
  }

  async disconnect(connectionId: string): Promise<void> {
    const entry = await this.get(connectionId);
    if (!entry) {
      throw new MongoDBError(
        ErrorCodes.UnknownConnectionId,
        `Connection "${connectionId}" does not exist or has expired.`
      );
    }
    await entry.close();
  }

  close(): Promise<void> {
    // The connection is owned by Compass, not by this registry.
    return Promise.resolve();
  }
}
