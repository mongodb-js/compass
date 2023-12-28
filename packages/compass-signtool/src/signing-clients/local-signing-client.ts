import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { debug } from '../utils';
import type { SigningClient } from '.';

const execAsync = promisify(exec);

export class LocalSigningClient implements SigningClient {
  constructor(private rootDir: string) {}

  private async init() {
    const garasignScript = `${this.rootDir}/garasign.sh`;
    await this.copyFile(
      path.join(__dirname, '..', '..', 'src', './garasign.sh'),
      garasignScript
    );
    await execAsync(`chmod +x ${garasignScript}`);
  }

  private async copyFile(from: string, to: string): Promise<void> {
    await execAsync(`cp ${from} ${to}`);
  }

  async sign(file: string): Promise<void> {
    debug('Signing file', file);

    const remotePath = path.join(this.rootDir, path.basename(file));

    try {
      await this.init();

      await this.copyFile(file, remotePath);
      debug(`LocalSigningClient: Copied file ${file} to ${remotePath}`);

      await execAsync(
        `cd ${this.rootDir} && ./garasign.sh ${path.basename(file)}`
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
