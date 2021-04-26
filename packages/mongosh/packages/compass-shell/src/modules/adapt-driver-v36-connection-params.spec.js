import { expect } from 'chai';
import { adaptDriverV36ConnectionParams } from './adapt-driver-v36-connection-params';

const LOCALHOST = 'mongodb://localhost:27017/';

describe('adaptDriverV36ConnectionParams', () => {
  it('removes useUnifiedTopology', () => {
    expect(
      adaptDriverV36ConnectionParams(LOCALHOST, { useUnifiedTopology: true })[1]
    ).to.not.contain.key('useUnifiedTopology');

    expect(
      adaptDriverV36ConnectionParams(LOCALHOST, { useUnifiedTopology: false })[1]
    ).to.not.contain.key('useUnifiedTopology');
  });

  it('removes connectWithNoPrimary', () => {
    expect(
      adaptDriverV36ConnectionParams(LOCALHOST, { connectWithNoPrimary: true })[1]
    ).to.not.contain.key('connectWithNoPrimary');

    expect(
      adaptDriverV36ConnectionParams(LOCALHOST, { connectWithNoPrimary: false })[1]
    ).to.not.contain.key('connectWithNoPrimary');
  });

  it('removes useNewUrlParser', () => {
    expect(
      adaptDriverV36ConnectionParams(LOCALHOST, { useNewUrlParser: true })[1]
    ).to.not.contain.key('useNewUrlParser');

    expect(
      adaptDriverV36ConnectionParams(LOCALHOST, { useNewUrlParser: false })[1]
    ).to.not.contain.key('useNewUrlParser');
  });

  it('removes checkServerIdentity only if is explicitly set to true', () => {
    expect(
      adaptDriverV36ConnectionParams(LOCALHOST, { checkServerIdentity: true })[1]
    ).to.not.contain.key('useNewUrlParser');

    expect(
      adaptDriverV36ConnectionParams(LOCALHOST, { checkServerIdentity: false })[1]
        .checkServerIdentity
    ).to.equal(false);
  });

  it('keeps other options', () => {
    const [, options] = adaptDriverV36ConnectionParams(
      'mongodb://localhost:27017',
      {somethingElse: true}
    );

    expect(options.somethingElse).to.equal(true);
  });

  it('replaces driver ssl options with filenames from connection model (unwrap arrays)', () => {
    const [, options] = adaptDriverV36ConnectionParams(
      LOCALHOST,
      {
        sslCA: Buffer.from('invalid-value'),
        sslCRL: Buffer.from('invalid-value'),
        sslCert: Buffer.from('invalid-value'),
        sslKey: Buffer.from('invalid-value'),
      },
      {
        sslCA: ['./valid-sslCA.file'],
        sslCRL: ['./valid-sslCRL.file'],
        sslCert: ['./valid-sslCert.file'],
        sslKey: ['./valid-sslKey.file'],
      }
    );

    expect(options.sslCA).to.equal('./valid-sslCA.file');
    expect(options.sslCRL).to.equal('./valid-sslCRL.file');
    expect(options.sslCert).to.equal('./valid-sslCert.file');
    expect(options.sslKey).to.equal('./valid-sslKey.file');
  });

  it('replaces driver ssl options with filenames from connection model', () => {
    const [, options] = adaptDriverV36ConnectionParams(
      LOCALHOST,
      {
        sslCA: Buffer.from('invalid-value'),
        sslCRL: Buffer.from('invalid-value'),
        sslCert: Buffer.from('invalid-value'),
        sslKey: Buffer.from('invalid-value'),
      },
      {
        sslCA: './valid-sslCA.file',
        sslCRL: './valid-sslCRL.file',
        sslCert: './valid-sslCert.file',
        sslKey: './valid-sslKey.file',
      }
    );

    expect(options.sslCA).to.equal('./valid-sslCA.file');
    expect(options.sslCRL).to.equal('./valid-sslCRL.file');
    expect(options.sslCert).to.equal('./valid-sslCert.file');
    expect(options.sslKey).to.equal('./valid-sslKey.file');
  });

  it('move gssapiServiceName from connection string to options', () => {
    const [ uri, options ] = adaptDriverV36ConnectionParams(
      `${LOCALHOST}?gssapiServiceName=some-name`,
      {}
    );

    expect(uri).to.equal(LOCALHOST);
    expect(options.authMechanismProperties.gssapiServiceName).to.equal('some-name');
  });

  it("doesn't add authMechanismProperties if not present", () => {
    const [, options] = adaptDriverV36ConnectionParams(LOCALHOST, {});
    expect(options).to.not.have.property('authMechanismProperties');
  });
});
