import path from 'path';
import { SSHClient, type SSHClientOptions } from './ssh-client';
import {
  LocalSigningClient,
  RemoteSigningClient,
  type SigningClient,
  type ClientType,
  type ClientOptions,
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

function getSigningScript() {
  return path.join(__dirname, '..', 'src', './garasign.sh');
}

async function getSshClient(sshOptions: SSHClientOptions) {
  const sshClient = new SSHClient(sshOptions);
  await sshClient.connect();
  return sshClient;
}

export async function getSigningClient<T extends ClientType>(
  client: T,
  options: ClientOptions<T>
): Promise<SigningClient> {
  if (client === 'remote') {
    const sshClient = await getSshClient(options as SSHClientOptions);
    // Currently only linux remote is supported to sign the artifacts
    return new RemoteSigningClient(sshClient, {
      rootDir: '~/garasign',
      signingScript: getSigningScript(),
    });
  }
  if (client === 'local') {
    // For local client, we put everything in a tmp directory to avoid
    // polluting the user's working directory.
    return new LocalSigningClient({
      rootDir: path.resolve(__dirname, '..', 'tmp'),
      signingScript: getSigningScript(),
    });
  }
  throw new Error(`Unknown client type: ${client}`);
}
