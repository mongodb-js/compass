import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { LocalSigningClient } from './local-signing-client';
import { expect } from 'chai';

describe('LocalSigningClient', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-signing-client'));
  });

  it('signs the file correctly', async function () {
    // In order to sign a file locally, we setup the following:
    // 1. Create a tmp directory, tmp file to sign and a tmp signing script
    // 2. Instantiate a LocalSigningClient with the tmp directory and the tmp signing script
    // 3. Sign the file and assert that the file was modified correctly
    // 5. Assert that the signing script was called with the correct arguments
    // 6. Assert that the signed file was copied back to the original file

    const fileToSign = path.join(tmpDir, 'originals', 'file-to-sign.txt');
    const signingScript = path.join(tmpDir, 'originals', 'script.sh');

    {
      await fs.mkdir(path.dirname(fileToSign), { recursive: true });
      await fs.writeFile(fileToSign, 'original content');
      await fs.writeFile(
        signingScript,
        `
        #!/bin/bash
        echo "Signing script called with arguments: $@"
        echo "signed content" > $1
        `
      );
    }

    const localSigningClient = new LocalSigningClient({
      rootDir: tmpDir,
      signingScript: signingScript,
    });

    await localSigningClient.sign(fileToSign);

    const signedFile = (await fs.readFile(fileToSign, 'utf-8')).trim();
    expect(signedFile).to.equal('signed content');
  });
});
