import path from 'path';
import { expect } from 'chai';
import type { CompassBrowser } from '../helpers/compass-browser';
import { beforeTests, afterTests, afterTest } from '../helpers/compass';
import type { Compass } from '../helpers/compass';
import * as Selectors from '../helpers/selectors';

describe('Connection form', function () {
  let compass: Compass;
  let browser: CompassBrowser;

  before(async function () {
    compass = await beforeTests();
    browser = compass.browser;
  });

  after(async function () {
    await afterTests(compass, this.currentTest);
  });

  beforeEach(async function () {
    await browser.resetConnectForm();
  });

  afterEach(async function () {
    await afterTest(compass, this.currentTest);
  });

  it('starts with the expected initial state', async function () {
    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal({
      connectionString: 'mongodb://localhost:27017',
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    });
  });

  it('parses and formats a URI for direct connection', async function () {
    const connectionString = 'mongodb://localhost:27017/?directConnection=true';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: true,
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for multiple hosts', async function () {
    const connectionString = 'mongodb://localhost:27017,localhost:27018/';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017', 'localhost:27018'],
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for mongodb+srv scheme', async function () {
    const connectionString = 'mongodb+srv://localhost/';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB_SRV',
      hosts: ['localhost'],
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for username/password authentication', async function () {
    const connectionString =
      'mongodb://foo:bar@localhost:27017/?authMechanism=SCRAM-SHA-1&authSource=source';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'DEFAULT',
      defaultUsername: 'foo',
      defaultPassword: 'bar',
      defaultAuthSource: 'source',
      defaultAuthMechanism: 'SCRAM-SHA-1',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for X.509 authentication', async function () {
    const fixturesPath = path.resolve(__dirname, '..', 'fixtures');
    const tlsCAFile = path.join(fixturesPath, 'ca.pem');
    const tlsCertificateKeyFile = path.join(fixturesPath, 'client.pem');
    const connectionString = `mongodb://localhost:27017/?authMechanism=MONGODB-X509&authSource=%24external&tls=true&tlsCAFile=${encodeURIComponent(
      tlsCAFile
    )}&tlsCertificateKeyFile=${encodeURIComponent(
      tlsCertificateKeyFile
    )}&tlsCertificateKeyFilePassword=password&tlsInsecure=true&tlsAllowInvalidHostnames=true&tlsAllowInvalidCertificates=true`;

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'MONGODB-X509',
      proxyMethod: 'none',
      sslConnection: 'ON',
      tlsCAFile: 'ca.pem',
      tlsCertificateKeyFile: 'client.pem',
      clientKeyPassword: 'password',
      tlsInsecure: true,
      tlsAllowInvalidHostnames: true,
      tlsAllowInvalidCertificates: true,
      readPreference: 'defaultReadPreference',
    };

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    expectedState.tlsCAFile = tlsCAFile;
    expectedState.tlsCertificateKeyFile = tlsCertificateKeyFile;

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for Kerberos authentication', async function () {
    const connectionString =
      'mongodb://principal:password@localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=SERVICE_NAME%3Aservice+name%2CCANONICALIZE_HOST_NAME%3Aforward%2CSERVICE_REALM%3Aservice+realm';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'GSSAPI',
      kerberosPassword: 'password',
      kerberosPrincipal: 'principal',
      kerberosProvidePassword: true,
      kerberosServiceName: 'service name',
      kerberosCanonicalizeHostname: 'forward',
      kerberosServiceRealm: 'service realm',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for LDAP authentication', async function () {
    const connectionString =
      'mongodb://username:password@localhost:27017/?authMechanism=PLAIN&authSource=%24external';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'PLAIN',
      ldapUsername: 'username',
      ldapPassword: 'password',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for AWS IAM authentication', async function () {
    const connectionString =
      'mongodb://id:key@localhost:27017/?authMechanism=MONGODB-AWS&authSource=%24external&authMechanismProperties=AWS_SESSION_TOKEN%3Atoken';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'MONGODB-AWS',
      awsAccessKeyId: 'id',
      awsSecretAccessKey: 'key',
      awsSessionToken: 'token',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI for Socks5 authentication', async function () {
    const connectionString =
      'mongodb://localhost:27017/?proxyHost=hostname&proxyPort=1234&proxyUsername=username&proxyPassword=password';

    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'AUTH_NONE',
      proxyMethod: 'socks',
      socksHost: 'hostname',
      socksPort: '1234',
      socksUsername: 'username',
      socksPassword: 'password',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('parses and formats a URI with advanced options', async function () {
    const connectionString =
      'mongodb://localhost:27017/default-db?readPreference=primary&replicaSet=replica-set&connectTimeoutMS=1234&maxPoolSize=100';
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );

    const expectedState = {
      connectionString,
      scheme: 'MONGODB',
      hosts: ['localhost:27017'],
      directConnection: false,
      authMethod: 'AUTH_NONE',
      proxyMethod: 'none',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'primary',
      replicaSet: 'replica-set',
      defaultDatabase: 'default-db',
      urlOptions: {
        connectTimeoutMS: '1234',
        maxPoolSize: '100',
      },
    };

    const state = await browser.getConnectFormState();
    expect(state).to.deep.equal(expectedState);

    await browser.setConnectFormState(expectedState);
    expect(
      await browser.$(Selectors.ConnectionStringInput).getValue()
    ).to.equal(connectionString);
  });

  it('does not update the URI for SSH tunnel with password authentication', async function () {
    const state = {
      proxyMethod: 'password',
      sshPasswordHost: 'host',
      sshPasswordPort: '1234',
      sshPasswordUsername: 'username',
      sshPasswordPassword: 'password',
    };
    await browser.setConnectFormState(state);
    expect(await browser.getConnectFormState()).to.deep.equal({
      authMethod: 'AUTH_NONE',
      connectionString: 'mongodb://localhost:27017/',
      directConnection: false,
      hosts: ['localhost:27017'],
      proxyMethod: 'password',
      scheme: 'MONGODB',
      sshPasswordHost: 'host',
      sshPasswordPassword: 'password',
      sshPasswordPort: '1234',
      sshPasswordUsername: 'username',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    });
  });

  it('does not update the URI for SSH tunnel with identity file authentication', async function () {
    const fixturesPath = path.resolve(__dirname, '..', 'fixtures');
    // reuse the .pem file from above. contents doesn't matter.
    const sshIdentityKeyFile = path.join(fixturesPath, 'client.pem');

    const state = {
      proxyMethod: 'identity',
      sshIdentityHost: 'host',
      sshIdentityPort: '1234',
      sshIdentityUsername: 'username',
      sshIdentityKeyFile: sshIdentityKeyFile,
      sshIdentityPassword: 'password',
    };
    await browser.setConnectFormState(state);
    expect(await browser.getConnectFormState()).to.deep.equal({
      authMethod: 'AUTH_NONE',
      connectionString: 'mongodb://localhost:27017/',
      directConnection: false,
      hosts: ['localhost:27017'],
      proxyMethod: 'identity',
      sshIdentityHost: 'host',
      sshIdentityKeyFile: 'client.pem',
      sshIdentityPassword: 'password',
      sshIdentityPort: '1234',
      sshIdentityUsername: 'username',
      scheme: 'MONGODB',
      sslConnection: 'DEFAULT',
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      tlsInsecure: false,
      readPreference: 'defaultReadPreference',
    });
  });
});
