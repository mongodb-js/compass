import path from 'path';
import { SSHClient, type SSHClientOptions } from './ssh-client';
import {
  type SigningClient,
  LocalSigningClient,
  RemoteSigningClient,
} from './signing-clients';

// eslint-disable-next-line no-console
export const debug = console.log;

export function assertRequiredVars() {
  [
    'GARASIGN_USERNAME',
    'GARASIGN_PASSWORD',
    'ARTIFACTORY_USERNAME',
    'ARTIFACTORY_PASSWORD',
  ].forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} is required`);
    }
  });
}

const getSshClient = async (sshOptions: SSHClientOptions) => {
  const sshClient = new SSHClient(sshOptions);
  await sshClient.connect();
  return sshClient;
};

export type ClientType = 'local' | 'remote';
export type ClientOptions<T> = T extends 'remote'
  ? Pick<SSHClientOptions, 'username' | 'host' | 'privateKey' | 'port'>
  : undefined;

export const getSigningClient = async <T extends ClientType>(
  client: T,
  options: ClientOptions<T>
): Promise<SigningClient> => {
  if (client === 'remote') {
    const sshClient = await getSshClient(options as SSHClientOptions);
    // Currently only linux remote is supported to sign the artifacts
    return new RemoteSigningClient(sshClient, '~/garasign');
  }
  if (client === 'local') {
    // For local client, we put everything in a tmp directory to avoid
    // polluting the user's working directory.
    return new LocalSigningClient(path.resolve(__dirname, '..', 'tmp'));
  }
  throw new Error(`Unknown client type: ${client}`);
};
