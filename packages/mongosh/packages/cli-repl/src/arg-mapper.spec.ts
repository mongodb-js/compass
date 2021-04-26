import { CliOptions } from '@mongosh/service-provider-server';
import chai, { expect } from 'chai';
import path from 'path';
import sinonChai from 'sinon-chai';
import sinon from 'ts-sinon';
import mapCliToDriver, { applyTlsCertificateSelector } from './arg-mapper';
chai.use(sinonChai);

describe('arg-mapper.mapCliToDriver', () => {
  context('when cli args have authenticationDatabase', () => {
    const cliOptions: CliOptions = { authenticationDatabase: 'authDb' };

    it('maps to authSource', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        authSource: 'authDb'
      });
    });
  });

  context('when cli args have authenticationMechanism', () => {
    const cliOptions: CliOptions = { authenticationMechanism: 'SCRAM-SHA-1' };

    it('maps to authMechanism', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        authMechanism: 'SCRAM-SHA-1'
      });
    });
  });

  context('when cli args have quiet', () => {
    const cliOptions: CliOptions = { quiet: true };

    it('maps to loggerLevel', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        loggerLevel: 'error'
      });
    });
  });

  context('when cli args have verbose', () => {
    const cliOptions: CliOptions = { verbose: true };

    it('maps to loggerLevel', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        loggerLevel: 'debug'
      });
    });
  });

  context('when cli args have username', () => {
    const cliOptions: CliOptions = { username: 'richard' };

    it('maps to auth object', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        auth: {
          username: 'richard'
        }
      });
    });
  });

  context('when cli args have password', () => {
    const cliOptions: CliOptions = { password: 'aphextwin' };

    it('maps to auth object', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        auth: {
          password: 'aphextwin'
        }
      });
    });
  });

  context('when cli args have username and password', () => {
    const cliOptions: CliOptions = { username: 'richard', password: 'aphextwin' };

    it('maps to auth object', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        auth: {
          username: 'richard',
          password: 'aphextwin'
        }
      });
    });
  });

  context('when cli args have retryWrites', () => {
    const cliOptions: CliOptions = { retryWrites: true };

    it('maps the same argument', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        retryWrites: true
      });
    });
  });

  context('when cli args have tls', () => {
    const cliOptions: CliOptions = { tls: true };

    it('maps the same argument', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        tls: true
      });
    });
  });

  context('when cli args have tlsAllowInvalidCertificates', () => {
    const cliOptions: CliOptions = { tlsAllowInvalidCertificates: true };

    it('maps the same argument', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        tlsAllowInvalidCertificates: true
      });
    });
  });

  context('when cli args have tlsAllowInvalidHostnames', () => {
    const cliOptions: CliOptions = { tlsAllowInvalidHostnames: true };

    it('maps the same argument', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        tlsAllowInvalidHostnames: true
      });
    });
  });

  context('when cli args have tlsCAFile', () => {
    const cliOptions: CliOptions = { tlsCAFile: 'ca' };

    it('maps the same argument', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        tlsCAFile: 'ca'
      });
    });
  });

  context('when cli args have tlsCRLFile', () => {
    const cliOptions: CliOptions = { tlsCRLFile: 'key' };

    it('maps to sslCRL', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        sslCRL: 'key'
      });
    });
  });

  context('when cli args have tlsCertificateKeyFile', () => {
    const cliOptions: CliOptions = { tlsCertificateKeyFile: 'key' };

    it('maps the same argument', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        tlsCertificateKeyFile: 'key'
      });
    });
  });

  context('when cli args have tlsCertificateKeyFilePassword', () => {
    const cliOptions: CliOptions = { tlsCertificateKeyFilePassword: 'pw' };

    it('maps the same argument', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        tlsCertificateKeyFilePassword: 'pw'
      });
    });
  });

  context('when the cli args have awsAccessKeyId', () => {
    const cliOptions: CliOptions = { awsAccessKeyId: 'awskey' };

    it('maps to autoEncryption', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        autoEncryption: {
          kmsProviders: {
            aws: {
              accessKeyId: 'awskey'
            }
          }
        }
      });
    });
  });

  context('when the cli args have awsSecretAccessKey', () => {
    const cliOptions: CliOptions = { awsSecretAccessKey: 'secretkey' };

    it('maps to autoEncryption', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        autoEncryption: {
          kmsProviders: {
            aws: {
              secretAccessKey: 'secretkey'
            }
          }
        }
      });
    });
  });

  context('when the cli args have awsIamSessionToken', () => {
    const cliOptions: CliOptions = { awsIamSessionToken: 'token' };

    it('maps to authMechanismProperties.AWS_SESSION_TOKEN', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        authMechanismProperties: {
          AWS_SESSION_TOKEN: 'token'
        }
      });
    });
  });

  context('when the cli args have keyVaultNamespace', () => {
    const cliOptions: CliOptions = { keyVaultNamespace: 'db.datakeys' };

    it('maps to autoEncryption', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        autoEncryption: {
          keyVaultNamespace: 'db.datakeys'
        }
      });
    });
  });

  context('when the cli args have all FLE options', () => {
    const cliOptions: CliOptions = {
      keyVaultNamespace: 'db.datakeys',
      awsSecretAccessKey: 'secretkey',
      awsAccessKeyId: 'awskey'
    };

    it('maps to autoEncryption', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        autoEncryption: {
          keyVaultNamespace: 'db.datakeys',
          kmsProviders: {
            aws: {
              accessKeyId: 'awskey',
              secretAccessKey: 'secretkey'
            }
          }
        }
      });
    });
  });

  context('when the cli args have all server API options options', () => {
    const cliOptions: CliOptions = {
      apiStrict: true,
      apiDeprecationErrors: true,
      apiVersion: '1'
    };

    it('maps to serverApi', async() => {
      expect(await mapCliToDriver(cliOptions)).to.deep.equal({
        serverApi: {
          strict: true,
          deprecationErrors: true,
          version: '1'
        }
      });
    });
  });
});

describe('arg-mapper.applyTlsCertificateSelector', () => {
  context('with fake ca provider', () => {
    let exportCertificateAndPrivateKey;
    beforeEach(() => {
      process.env.TEST_OS_EXPORT_CERTIFICATE_AND_KEY_PATH =
        path.resolve(__dirname, '..', 'test', 'fixtures', 'fake-os-ca-provider.js');
      exportCertificateAndPrivateKey = sinon.stub();
      require(process.env.TEST_OS_EXPORT_CERTIFICATE_AND_KEY_PATH)
        .setFn((search) => exportCertificateAndPrivateKey(search));
    });
    afterEach(() => {
      delete process.env.TEST_OS_EXPORT_CERTIFICATE_AND_KEY_PATH;
    });

    it('leaves node options unchanged when no selector is given', () => {
      const options = {};
      applyTlsCertificateSelector(undefined, options);
      expect(options).to.deep.equal({});
    });

    it('throws when the selector has an odd format', () => {
      const options = {};
      expect(() => applyTlsCertificateSelector('foo=bar', options))
        .to.throw(/tlsCertificateSelector needs to include subject or thumbprint/);
      expect(options).to.deep.equal({});
    });

    it('returns passphrase and pfx as given by the (fake) OS', () => {
      const passphrase = 'abc';
      const pfx = Buffer.from('abcdef');
      exportCertificateAndPrivateKey.returns({
        passphrase, pfx
      });
      const options = {};
      applyTlsCertificateSelector('subject=Foo Bar', options);
      expect(options).to.deep.equal({
        passphrase, pfx
      });
    });
  });

  context('with what the OS gives us', () => {
    it('throws an error on non-win32 and non-darwin', function() {
      if (process.platform === 'win32' || process.platform === 'darwin') {
        return this.skip();
      }
      const options = {};
      expect(() => applyTlsCertificateSelector('subject=Foo Bar', options))
        .to.throw(/tlsCertificateSelector is not supported on this platform/);
    });

    it('tries to search the OS CA store on win32', function() {
      if (process.platform !== 'win32') {
        return this.skip();
      }
      const options = {};
      expect(() => applyTlsCertificateSelector('subject=Foo Bar', options))
        .to.throw(/Could not resolve certificate specification/);
    });

    it('tries to search the OS keychain on darwin', function() {
      if (process.platform !== 'darwin') {
        return this.skip();
      }
      const options = {};
      expect(() => applyTlsCertificateSelector('subject=Foo Bar', options))
        .to.throw(/Could not find a matching certificate/);
    });
  });
});
