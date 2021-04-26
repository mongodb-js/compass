import { assert, expect } from 'chai';
import { promises as fs } from 'fs';
import path from 'path';
import { skipIfEnvServerVersion, startTestServer } from '../../../testing/integration-testing-hooks';
import { useTmpdir } from './repl-helpers';
import { TestShell } from './test-shell';

function getCertPath(filename: string): string {
  return path.join(__dirname, 'fixtures', 'certificates', filename);
}
const CA_CERT = getCertPath('ca.crt');
const NON_CA_CERT = getCertPath('non-ca.crt');
const CLIENT_CERT = getCertPath('client.bundle.pem');
const CLIENT_CERT_PFX = getCertPath('client.bundle.pfx');
const INVALID_CLIENT_CERT = getCertPath('invalid-client.bundle.pem');
const SERVER_KEY = getCertPath('server.bundle.pem');
const CRL_INCLUDING_SERVER = getCertPath('ca-server.crl');

describe('e2e TLS', () => {
  before(async() => {
    assert((await fs.stat(CA_CERT)).isFile());
    assert((await fs.stat(NON_CA_CERT)).isFile());
    assert((await fs.stat(CLIENT_CERT)).isFile());
    assert((await fs.stat(CLIENT_CERT_PFX)).isFile());
    assert((await fs.stat(INVALID_CLIENT_CERT)).isFile());
    assert((await fs.stat(SERVER_KEY)).isFile());
    assert((await fs.stat(CRL_INCLUDING_SERVER)).isFile());
  });

  afterEach(TestShell.cleanup);

  context('for server < 4.2', () => {
    skipIfEnvServerVersion('>= 4.2');
    registerTlsTests({
      tlsMode: '--sslMode',
      tlsModeValue: 'requireSSL',
      tlsCertificateFile: '--sslPEMKeyFile',
      tlsCaFile: '--sslCAFile'
    });
  });
  context('for server >= 4.2', () => {
    skipIfEnvServerVersion('< 4.2');
    registerTlsTests({
      tlsMode: '--tlsMode',
      tlsModeValue: 'requireTLS',
      tlsCertificateFile: '--tlsCertificateKeyFile',
      tlsCaFile: '--tlsCAFile'
    });
  });

  function registerTlsTests({ tlsMode: serverTlsModeOption, tlsModeValue: serverTlsModeValue, tlsCertificateFile: serverTlsCertificateKeyFileOption, tlsCaFile: serverTlsCAFileOption }) {
    context('connecting without client cert', () => {
      after(async() => {
        // mlaunch has some trouble interpreting all the server options correctly,
        // and subsequently can't connect to the server to find out if it's up,
        // then thinks it isn't and doesn't shut it down cleanly. We shut it down
        // here to work around that.
        const shell = TestShell.start({ args:
          [
            await server.connectionString(),
            '--tls', '--tlsCAFile', CA_CERT
          ]
        });
        await shell.waitForPrompt();
        await shell.executeLine('db.shutdownServer({ force: true })');
        shell.kill();
        await shell.waitForExit();
      });
      afterEach(TestShell.cleanup);

      const server = startTestServer(
        'not-shared', '--hostname', 'localhost',
        serverTlsModeOption, serverTlsModeValue,
        serverTlsCertificateKeyFileOption, SERVER_KEY
      );

      it('works with matching CA (args)', async() => {
        const shell = TestShell.start({
          args: [
            await server.connectionString(),
            '--tls', '--tlsCAFile', CA_CERT
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');
      });

      it('works with matching CA (connection string)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?tls=true&tlsCAFile=${encodeURIComponent(CA_CERT)}`
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('prompt');
      });

      it('fails when not using --tls (args)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('exit');
        shell.assertContainsOutput('MongoServerSelectionError');
      });

      it('fails when not using --tls (connection string)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500&tls=false`
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('exit');
        shell.assertContainsOutput('MongoServerSelectionError');
      });

      it('fails with invalid CA (args)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`,
            '--tls', '--tlsCAFile', NON_CA_CERT
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('exit');
        shell.assertContainsOutput('unable to verify the first certificate');
      });

      it('fails with invalid CA (connection string)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500&tls=true&tlsCAFile=${encodeURIComponent(NON_CA_CERT)}`
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('exit');
        shell.assertContainsOutput('unable to verify the first certificate');
      });

      it('fails when providing a CRL including the servers cert', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`,
            '--tls', '--tlsCAFile', CA_CERT, '--tlsCRLFile', CRL_INCLUDING_SERVER
          ]
        });
        const result = await shell.waitForPromptOrExit();
        expect(result.state).to.equal('exit');
        shell.assertContainsOutput('certificate revoked');
      });
    });

    context('connecting with client cert', () => {
      const tmpdir = useTmpdir();

      after(async() => {
        const shell = TestShell.start({ args:
          [
            await server.connectionString(),
            '--tls', '--tlsCAFile', CA_CERT,
            '--tlsCertificateKeyFile', CLIENT_CERT
          ]
        });
        await shell.waitForPrompt();
        await shell.executeLine('db.shutdownServer({ force: true })');
        shell.kill();
        await shell.waitForExit();
      });
      afterEach(TestShell.cleanup);

      const server = startTestServer(
        'not-shared', '--hostname', 'localhost',
        serverTlsModeOption, serverTlsModeValue,
        serverTlsCertificateKeyFileOption, SERVER_KEY,
        serverTlsCAFileOption, CA_CERT
      );
      const certUser = 'emailAddress=tester@example.com,CN=Wonderwoman,OU=DevTools Testers,O=MongoDB';

      before(async() => {
        /* connect with cert to create user */
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`,
            '--tls', '--tlsCAFile', CA_CERT,
            '--tlsCertificateKeyFile', CLIENT_CERT
          ]
        });
        const prompt = await shell.waitForPromptOrExit();
        expect(prompt.state).to.equal('prompt');
        await shell.executeLine(`db=db.getSiblingDB('$external');db.runCommand({
          createUser: '${certUser}',
          roles: [
            {role: 'userAdminAnyDatabase', db: 'admin'}
          ]
        })`);
        shell.assertContainsOutput('{ ok: 1 }');
      });

      it('works with valid cert (args)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`,
            '--authenticationMechanism', 'MONGODB-X509',
            '--tls', '--tlsCAFile', CA_CERT,
            '--tlsCertificateKeyFile', CLIENT_CERT
          ]
        });
        const prompt = await shell.waitForPromptOrExit();
        expect(prompt.state).to.equal('prompt');
        await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        shell.assertContainsOutput(`user: '${certUser}'`);
      });

      it('works with valid cert (connection string)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`
            + '&authMechanism=MONGODB-X509'
            + `&tls=true&tlsCAFile=${encodeURIComponent(CA_CERT)}&tlsCertificateKeyFile=${encodeURIComponent(CLIENT_CERT)}`
          ]
        });
        const prompt = await shell.waitForPromptOrExit();
        expect(prompt.state).to.equal('prompt');
        await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        shell.assertContainsOutput(`user: '${certUser}'`);
      });

      it('fails with invalid cert (args)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`,
            '--authenticationMechanism', 'MONGODB-X509',
            '--tls', '--tlsCAFile', CA_CERT,
            '--tlsCertificateKeyFile', INVALID_CLIENT_CERT
          ]
        });
        const exit = await shell.waitForPromptOrExit();
        expect(exit.state).to.equal('exit');
        shell.assertContainsOutput('MongoServerSelectionError');
      });

      it('fails with invalid cert (connection string)', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`
            + '&authMechanism=MONGODB-X509'
            + `&tls=true&tlsCAFile=${encodeURIComponent(CA_CERT)}&tlsCertificateKeyFile=${encodeURIComponent(INVALID_CLIENT_CERT)}`
          ]
        });
        const exit = await shell.waitForPromptOrExit();
        expect(exit.state).to.equal('exit');
        shell.assertContainsOutput('MongoServerSelectionError');
      });

      it('works with valid cert (with tlsCertificateSelector)', async() => {
        const fakeOsCaModule = path.resolve(tmpdir.path, 'fake-ca.js');
        await fs.writeFile(fakeOsCaModule, `
        const fs = require('fs');
        module.exports = () => ({
          passphrase: 'passw0rd',
          pfx: fs.readFileSync(${JSON.stringify(CLIENT_CERT_PFX)})
        });
        `);
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`,
            '--authenticationMechanism', 'MONGODB-X509',
            '--tls', '--tlsCAFile', CA_CERT,
            '--tlsCertificateSelector', 'subject=tester@example.com'
          ],
          env: {
            ...process.env,
            TEST_OS_EXPORT_CERTIFICATE_AND_KEY_PATH: fakeOsCaModule
          }
        });
        const prompt = await shell.waitForPromptOrExit();
        expect(prompt.state).to.equal('prompt');
        await shell.executeLine('db.runCommand({ connectionStatus: 1 })');
        shell.assertContainsOutput(`user: '${certUser}'`);
      });

      it('fails with an invalid tlsCertificateSelector', async() => {
        const shell = TestShell.start({
          args: [
            `${await server.connectionString()}?serverSelectionTimeoutMS=1500`,
            '--authenticationMechanism', 'MONGODB-X509',
            '--tls', '--tlsCAFile', CA_CERT,
            '--tlsCertificateSelector', 'subject=tester@example.com'
          ]
        });
        const prompt = await shell.waitForPromptOrExit();
        expect(prompt.state).to.equal('exit');
        if (process.platform === 'win32') {
          shell.assertContainsOutput('Could not resolve certificate specification');
        } else if (process.platform === 'darwin') {
          shell.assertContainsOutput('Could not find a matching certificate');
        } else {
          shell.assertContainsOutput('tlsCertificateSelector is not supported on this platform');
        }
      });
    });
  }
});
