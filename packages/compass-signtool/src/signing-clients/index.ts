import { type SSHClientOptions } from '../ssh-client';

export { LocalSigningClient } from './local-signing-client';
export { RemoteSigningClient } from './remote-signing-client';

export type SigningClientOptions = {
  rootDir: string;
  signingScript: string;
};

export type ClientType = 'local' | 'remote';
export type ClientOptions<T> = T extends 'remote'
  ? Pick<SSHClientOptions, 'username' | 'host' | 'privateKey' | 'port'>
  : undefined;

export interface SigningClient {
  sign(file: string): Promise<void>;
}
