import type { MongoClient } from 'mongodb';
import type { Callback } from '../src/types';

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
  collections: Record<string, string[]>;
  clientOptions: Record<string, unknown>;
};

export function createMongoClientMock({
  hosts = [{ host: 'localhost', port: 9999 }],
  commands = {},
  collections = {},
  clientOptions = {},
}: Partial<ClientMockOptions> = {}): MongoClient {
  const db = {
    command(spec: any, callback?: Callback<any>) {
      if (typeof callback === 'function') {
        db.command(spec)!.then(
          (result) => callback(null, result),
          (err) => callback(err, null)
        );
        return;
      }

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

  return client as unknown as MongoClient;
}
