import type { MongoClient } from 'mongodb';

type ClientMockOptions = {
  hosts: [{ host: string; port: number }];
  commands: Partial<{
    connectionStatus: unknown;
    getCmdLineOpts: unknown;
    hostInfo: unknown;
    buildInfo: unknown;
    getParameter: unknown;
    atlasVersion: unknown;
  }>;
  collections: Record<string, string[]>;
};

export function createMongoClientMock({
  hosts = [{ host: 'localhost', port: 9999 }],
  commands = {},
  collections = {},
}: Partial<ClientMockOptions> = {}): MongoClient {
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
    },
  };

  return client as MongoClient;
}
