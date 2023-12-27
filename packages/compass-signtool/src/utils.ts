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
    'DOCKER_ARTIFACTORY_USERNAME',
    'DOCKER_ARTIFACTORY_PASSWORD',
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

const SIGNING_DIR = '/home/ubuntu/garasign';
export const getSigningClient = async <T extends ClientType>(
  client: T,
  options: ClientOptions<T>
): Promise<SigningClient> => {
  if (client === 'remote') {
    const sshClient = await getSshClient(options as SSHClientOptions);
    return new RemoteSigningClient(sshClient, SIGNING_DIR);
  }
  return new LocalSigningClient(SIGNING_DIR);
};
