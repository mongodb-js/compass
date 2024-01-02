import type { SFTPWrapper } from 'ssh2';
import { Client, type ConnectConfig } from 'ssh2';
import { readFile } from 'fs/promises';
import { debug } from './utils';

export type SSHClientOptions = ConnectConfig & {
  // Absolute path to private key file. We will read it when connecting.
  privateKey?: string;
};

export class SSHClient {
  private sshConnection: Client;
  private sftpConnection?: SFTPWrapper;

  private connected = false;

  constructor(private sshClientOptions: SSHClientOptions) {
    this.sshConnection = new Client();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.sshConnection.on('ready', () => {
      debug('SSH: Connection established');
      this.connected = true;
    });
    this.sshConnection.on('error', (err) => {
      debug('SSH: Connection error', err);
      this.connected = false;
    });
    this.sshConnection.on('close', () => {
      debug('SSH: Connection closed');
      this.connected = false;
      this.sshConnection.destroy();
    });
  }

  async connect() {
    if (this.connected) {
      return Promise.resolve();
    }
    const privateKey = this.sshClientOptions.privateKey
      ? await readFile(this.sshClientOptions.privateKey)
      : undefined;
    return new Promise((resolve, reject) => {
      this.sshConnection.connect({
        ...this.sshClientOptions,
        privateKey,
      });
      this.sshConnection.on('error', reject);
      this.sshConnection.on('ready' as any, resolve);
    });
  }

  disconnect() {
    this.sshConnection.end();
    this.connected = false;
  }

  async exec(command: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected to ssh server');
    }
    return new Promise((resolve, reject) => {
      this.sshConnection.exec(command, (err, stream) => {
        if (err) {
          return reject(err);
        }
        let data = '';
        stream.on('data', (chunk: string) => {
          data += chunk;
        });
        stream.stderr.on('data', (chunk) => {
          data += chunk;
        });
        stream.on('close', (code: number) => {
          if (code === 0) {
            return resolve(data);
          } else {
            return reject(
              new Error(`Command failed with code ${code}. Error: ${data}`)
            );
          }
        });
      });
    });
  }

  async getSftpConnection(): Promise<SFTPWrapper> {
    if (!this.connected) {
      throw new Error('Not connected to ssh server');
    }

    if (this.sftpConnection) {
      return Promise.resolve(this.sftpConnection);
    }

    return new Promise((resolve, reject) => {
      this.sshConnection.sftp((err, sftp) => {
        if (err) {
          debug('SFTP: Failed to setup connection', err);
          return reject(err);
        }
        debug('SFTP: Connection established');
        this.sftpConnection = sftp;
        return resolve(sftp);
      });
    });
  }
}
