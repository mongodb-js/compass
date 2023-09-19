import type { MongoClient, Document } from 'mongodb';
import { ConnectionString } from 'mongodb-connection-string-url';

import type { SearchIndex } from '../src/search-index-detail-helper';

const ALLOWED_COMMANDS = [
  'listDatabases',
  'connectionStatus',
  'getCmdLineOpts',
  'hostInfo',
  'buildInfo',
  'getParameter',
  'atlasVersion',
  'collMod',
] as const;

export type ClientMockOptions = {
  hosts: [{ host: string; port: number }];
  commands: Partial<Record<typeof ALLOWED_COMMANDS[number], unknown>>;
  collections: Record<string, string[] | Error>;
  searchIndexes: Record<string, Record<string, SearchIndex[] | Error>>;
  clientOptions: Record<string, unknown>;
  hasAdminDotAtlasCliEntry: boolean;
};

export function createMongoClientMock({
  hosts = [{ host: 'localhost', port: 9999 }],
  commands = {},
  collections = {},
  searchIndexes = {},
  clientOptions = {},
  hasAdminDotAtlasCliEntry = false,
}: Partial<ClientMockOptions> = {}): {
  client: MongoClient;
  connectionString: string;
} {
  const db = {
    command(spec: Document) {
      const cmd = Object.keys(spec).find((key) =>
        ALLOWED_COMMANDS.includes(key as typeof ALLOWED_COMMANDS[number])
      );
      if (cmd && commands[cmd]) {
        const command = commands[cmd];
        const result = typeof command === 'function' ? command(this) : command;
        if (result instanceof Error) {
          return Promise.reject(result);
        }
        return Promise.resolve({ ...result, ok: 1 });
      }

      return Promise.reject(
        new Error(
          `not authorized on ${String(
            this.databaseName
          )} to execute command ${JSON.stringify(spec)}`
        )
      );
    },
  };

  const client = {
    db(databaseName: string) {
      return {
        ...db,
        databaseName,
        listCollections() {
          return {
            *[Symbol.asyncIterator]() {
              const colls = collections[databaseName] ?? [];
              if (colls instanceof Error) {
                throw colls;
              }
              yield* colls.map((name) => ({ name, type: 'collection' }));
            },
            toArray() {
              const colls = collections[databaseName] ?? [];
              if (colls instanceof Error) {
                return Promise.reject(colls);
              }
              return Promise.resolve(
                colls.map((name) => ({ name, type: 'collection' }))
              );
            },
          };
        },
        collection(collectionName: string) {
          return {
            listSearchIndexes() {
              return {
                toArray() {
                  const indexes =
                    searchIndexes[databaseName][collectionName] ?? [];
                  if (indexes instanceof Error) {
                    return Promise.reject(indexes);
                  }
                  return Promise.resolve(indexes);
                },
                close() {
                  /* ignore */
                },
              };
            },
            createSearchIndex({ name }: { name: string }) {
              return Promise.resolve(name);
            },
            updateSearchIndex() {
              return Promise.resolve();
            },
            dropSearchIndex() {
              return Promise.resolve();
            },
            countDocuments(query: Document) {
              return databaseName === 'admin' &&
                collectionName === 'atlascli' &&
                query.managedClusterType === 'atlasCliLocalDevCluster' &&
                hasAdminDotAtlasCliEntry
                ? 1
                : 0;
            },
          };
        },
      };
    },
    options: {
      hosts,
      ...clientOptions,
    },
    close() {
      /* ignore */
    },
  };

  const hostsWithPorts = hosts.map(({ host, port }) => `${host}:${port}`);
  // Note: This builds a dummy connection string only to replace the dummy host
  // with actual hosts right after
  const connectionString = new ConnectionString('mongodb://localhost:27017');
  connectionString.hosts = hostsWithPorts;

  return {
    client: client as unknown as MongoClient,
    connectionString: connectionString.toString(),
  };
}
