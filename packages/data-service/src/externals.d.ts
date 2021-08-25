declare module 'mongodb-connection-model' {
  import { ConnectionOptions, MongoClient, ReadPreferenceLike } from 'mongodb';

  export function connect(
    model: ConnectionModel,
    setupListeners: (client: MongoClient) => void,
    callback: (
      err: Error,
      client: MongoClient,
      tunnel: SshTunnel,
      connectionOptions: ConnectionOptions
    ) => void
  ): void;

  export interface ConnectionModel {
    hostname: string;
    port: number;
    ns: string;
    readPreference: ReadPreferenceLike;
  }

  export interface SshTunnel {
    listen(): Promise<void>;
    close(): Promise<void>;
  }
}

declare module 'mongodb-index-model' {
  import { MongoClient } from 'mongodb';

  export function fetch(
    client: MongoClient,
    namespace: string,
    callback: (err?: Error, result: IndexDetails[]) => void
  ): void;

  export interface IndexDetails {
    name: string;
  }
}

declare module 'mongodb-ns' {
  export default function parseNamespace(namespace: string): {
    database: string;
    collection: string;
  };
}
