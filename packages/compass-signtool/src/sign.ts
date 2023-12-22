import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SSHClient } from './ssh-client';
import { SigningClient } from './signing-client';
import { assertRequiredVars } from './utils';

const execAsync = promisify(exec);

async function getSpawnnedHostName() {
  // todo: this will fail
  // return 'ec2-3-254-76-71.eu-west-1.compute.amazonaws.com';
  const command = `tr -d '"[]{}' < ${path.resolve(
    process.cwd(),
    './spawned_hosts.yml'
  )} | cut -d , -f 1 | awk -F : '{print $2}'`;
  const { stdout } = await execAsync(command);
  return stdout.trim();
}

const getSshClient = async () => {
  const hostname = await getSpawnnedHostName();
  const sshClient = new SSHClient({
    host: hostname,
    port: 22,
    username: 'ubuntu',
    // todo: this will fail?
    privateKey: path.resolve('/.ssh/mcipacker.pem'),
  });
  await sshClient.connect();
  return sshClient;
};

export const sign = async (file: string) => {
  assertRequiredVars();

  const sshClient = await getSshClient();

  try {
    // Spawned host is an ubuntu machine
    const rootDir = '/home/ubuntu/garasign';
    const signingClient = new SigningClient(sshClient, rootDir);
    await signingClient.sign(file);
  } catch (err) {
    console.error(err);
  } finally {
    sshClient?.disconnect();
  }
};
