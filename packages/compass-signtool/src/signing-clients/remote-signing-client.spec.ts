import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { RemoteSigningClient } from './remote-signing-client';
import { expect } from 'chai';
import type { SSHClient } from '../ssh-client';

const getMockedSSHClient = () => {
  return {
    getSftpConnection: () => {
      return {
        fastPut: async (
          localFile: string,
          remoteFile: string,
          cb: (err?: Error) => void
        ) => {
          try {
            await fs.copyFile(localFile, remoteFile);
            cb();
          } catch (err) {
            cb(err);
          }
        },
        fastGet: async (
          remoteFile: string,
          localFile: string,
          cb: (err?: Error) => void
        ) => {
          try {
            await fs.copyFile(remoteFile, localFile);
            cb();
          } catch (err) {
            cb(err);
          }
        },
        unlink: async (remoteFile: string, cb: (err?: Error) => void) => {
          try {
            await fs.unlink(remoteFile);
            cb();
          } catch (err) {
            cb(err);
          }
        },
      };
    },
    exec: (command: string) => {
      return new Promise((resolve, reject) => {
        exec(command, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve('Ok');
        });
      });
    },
    disconnect: () => {},
  } as unknown as SSHClient;
};

describe('RemoteSigningClient', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'remote-signing-client'));
  });

  it('signs the file correctly', async function () {
    const fileToSign = path.join(tmpDir, 'originals', 'file-to-sign.txt');
    const signingScript = path.join(tmpDir, 'originals', 'script.sh');

    {
      await fs.mkdir(path.dirname(fileToSign), { recursive: true });
      await fs.writeFile(fileToSign, 'RemoteSigningClient: original content');
      await fs.writeFile(
        signingScript,
        `
        #!/bin/bash
        echo "Signing script called with arguments: $@"
        echo "RemoteSigningClient: signed content" > $1
        `
      );
    }

    const remoteSigningClient = new RemoteSigningClient(getMockedSSHClient(), {
      rootDir: tmpDir,
      signingScript: signingScript,
    });

    await remoteSigningClient.sign(fileToSign);

    const signedFile = (await fs.readFile(fileToSign, 'utf-8')).trim();
    expect(signedFile).to.equal('RemoteSigningClient: signed content');
  });
});
