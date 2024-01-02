import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { debug } from '../utils';
import type { SigningClient, SigningClientOptions } from '.';

const execAsync = promisify(exec);

export class LocalSigningClient implements SigningClient {
  constructor(private options: SigningClientOptions) {}

  private async init() {
    const remoteScript = `${this.options.rootDir}/garasign.sh`;
    await execAsync(`mkdir -p ${this.options.rootDir}`);
    await this.copyFile(this.options.signingScript, remoteScript);
    await execAsync(`chmod +x ${remoteScript}`);
  }

  private async copyFile(from: string, to: string): Promise<void> {
    await execAsync(`cp ${from} ${to}`);
  }

  async sign(file: string): Promise<void> {
    debug('Signing file', file);

    const remotePath = path.join(this.options.rootDir, path.basename(file));

    try {
      await this.init();

      await this.copyFile(file, remotePath);
      debug(`LocalSigningClient: Copied file ${file} to ${remotePath}`);

      await execAsync(
        `cd ${this.options.rootDir} && ./garasign.sh ${path.basename(file)}`,
        {
          env: {
            garasign_username: process.env.GARASIGN_USERNAME,
            garasign_password: process.env.GARASIGN_PASSWORD,
            artifactory_username: process.env.ARTIFACTORY_USERNAME,
            artifactory_password: process.env.ARTIFACTORY_PASSWORD,
          },
        }
      );
      debug(`LocalSigningClient: Signed file ${remotePath}`);

      await this.copyFile(remotePath, file);
      debug(
        `LocalSigningClient: Copied signed file back from ${remotePath} to ${file}`
      );
    } finally {
      // Clean up
      void execAsync(`rm -f ${remotePath}`);
    }
  }
}
