import { Db, MongoClient } from 'mongodb';

type ClientMockOptions = {
  commands: Partial<{
    connectionStatus: unknown;
    getCmdLineOpts: unknown;
    hostInfo: unknown;
    buildInfo: unknown;
    getParameter: unknown;
  }>;
  collections: Record<string, string[]>;
};

export function createMongoClientMock({
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
  };

  return client as MongoClient;
}
