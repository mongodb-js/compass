import SSHTunnel from '@mongodb-js/ssh-tunnel';
import { MongoClientOptions, MongoClient, ReadPreferenceLike } from 'mongodb';
import { ConnectionSshOptions } from './connection-options';

export interface LegacyConnectionModel {
  hostname: string;
  port: number;
  ns: string;
  readPreference: ReadPreferenceLike;
  sshTunnel?: string;
  sshTunnelOptions?: ConnectionSshOptions;
  driverUrlWithSsh: string;
  driverOptions: MongoClientOptions;
  directConnection?: boolean;
  hosts: string[];
  isSrvRecord?: boolean;
  loadBalanced?: boolean;
  replicaSet?: string;

  connect(
    model: LegacyConnectionModel,
    setupListeners: (client: MongoClient) => void,
    callback: (
      err: Error,
      client: MongoClient,
      tunnel: SSHTunnel,
      options: MongoClientOptions
    ) => void
  ): void;
}
