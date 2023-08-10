import type { MongoClient } from 'mongodb';
import { ConnectionString } from 'mongodb-connection-string-url';

export type ClientMockOptions = {
  hosts: [{ host: string; port: number }];
  commands: Partial<{
    connectionStatus: unknown;
    getCmdLineOpts: unknown;
    hostInfo: unknown;
    buildInfo: unknown;
    getParameter: unknown;
    atlasVersion: unknown;
    listDatabases: unknown;
    collMod: unknown;
  }>;
  collections: Record<string, string[] | Error>;
  clientOptions: Record<string, unknown>;
};

export function createMongoClientMock({
  hosts = [{ host: 'localhost', port: 9999 }],
  commands = {},
  collections = {},
  clientOptions = {},
}: Partial<ClientMockOptions> = {}): {
  client: MongoClient;
  connectionString: string;
} {
  const db = {
    command(spec: any) {
      const cmd = Object.keys(spec).find((key) =>
        [
          'listDatabases',
          'connectionStatus',
          'getCmdLineOpts',
          'hostInfo',
          'buildInfo',
          'getParameter',
          'atlasVersion',
          'collMod',
        ].includes(key)
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
