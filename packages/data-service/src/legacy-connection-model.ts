import SSHTunnel, { SshTunnelConfig } from '@mongodb-js/ssh-tunnel';
import { MongoClient, MongoClientOptions, ReadPreferenceLike } from 'mongodb';

export interface LegacyConnectionModel {
  hostname: string;
  port: number;
  ns: string;
  readPreference: ReadPreferenceLike;
  sshTunnel?: 'NONE' | 'USER_PASSWORD' | 'IDENTITY_FILE';
  sshTunnelHostname?: string;
  sshTunnelPort?: number;
  sshTunnelBindToLocalPort?: number;
  sshTunnelUsername?: string;
  sshTunnelPassword?: string;
  sshTunnelIdentityFile?: string;
  sshTunnelPassphrase?: string;
  readonly sshTunnelOptions?: SshTunnelConfig;
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
