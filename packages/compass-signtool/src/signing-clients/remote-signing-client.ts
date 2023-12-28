import path from 'path';
import type { SFTPWrapper } from 'ssh2';
import type { SSHClient } from '../ssh-client';
import { debug } from '../utils';
import type { SigningClient } from '.';

export class RemoteSigningClient implements SigningClient {
  private sftpConnection!: SFTPWrapper;

  constructor(private sshClient: SSHClient, private rootDir: string) {}

  /**
   * Initialize the signing client and setup remote machine to be ready for signing
   * the files. This will do following things:
   * - Create a working directory on the remote machine
   * - Copy the signing script to the remote machine
   */
  private async init() {
    this.sftpConnection = await this.sshClient.getSftpConnection();
    await this.sshClient.exec(`mkdir -p ${this.rootDir}`);

    // Copy the signing script to the remote machine
    {
      const remoteGarasignScript = `${this.rootDir}/garasign.sh`;
      const localGarasignScript = path.join(
        __dirname,
        '..',
        '..',
        'src',
        './garasign.sh'
      );
      await this.copyFile(localGarasignScript, remoteGarasignScript);
      await this.sshClient.exec(`chmod +x ${remoteGarasignScript}`);
    }
  }

  private getRemoteFilePath(file: string) {
    return `${this.rootDir}/temp-${Date.now()}-${path.basename(file)}`;
  }

  private async copyFile(file: string, remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftpConnection.fastPut(file, remotePath, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  private async downloadFile(remotePath: string, file: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftpConnection.fastGet(remotePath, file, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  private async removeFile(remotePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.sftpConnection.unlink(remotePath, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  private async signRemoteFile(file: string) {
    /**
     * Passing env variables as an option to ssh.exec() doesn't work as ssh config
     * (`sshd_config.AllowEnv`) does not allow to pass env variables by default.
     * So, here we are passing the env variables as part of the command.
     */
    const cmds = [
      `cd ${this.rootDir}`,
      `export garasign_username=${process.env.GARASIGN_USERNAME}`,
      `export garasign_password=${process.env.GARASIGN_PASSWORD}`,
      `export artifactory_username=${process.env.ARTIFACTORY_USERNAME}`,
      `export artifactory_password=${process.env.ARTIFACTORY_PASSWORD}`,
      `./garasign.sh ${file}`,
    ];
    const command = cmds.join(' && ');
    const res = await this.sshClient.exec(command);
    debug('Sign remote file response\n', res.trim());
  }

  async sign(file: string): Promise<void> {
    const remotePath = this.getRemoteFilePath(file);
    try {
      // establish connection
      await this.init();

      await this.copyFile(file, remotePath);
      debug(`SFTP: Copied file ${file} to ${remotePath}`);

      await this.signRemoteFile(remotePath);
      debug(`SFTP: Signed file ${file}`);

      await this.downloadFile(remotePath, file);
      debug(`SFTP: Downloaded signed file to ${file}`);
    } finally {
      await this.removeFile(remotePath);
      debug(`SFTP: Removed remote file ${remotePath}`);
      this.sshClient.disconnect();
    }
  }
}
