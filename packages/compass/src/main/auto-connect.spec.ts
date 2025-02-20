import sinon from 'sinon';
import { expect } from 'chai';
import type { AutoConnectPreferences } from './auto-connect';
import {
  resetForTesting,
  registerMongoDbUrlForBrowserWindow,
  getWindowAutoConnectPreferences,
} from './auto-connect';
import { dialog } from 'electron';
import type { MessageBoxReturnValue } from 'electron';

const USER_CONFIRMED_CONNECTION_ATTEMPT = 0;

const USER_CANCELED_CONNECTION_ATTEMPT = 1;

const URI_WITH_DISALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP =
  'mongodb://localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=SERVICE_HOST%3Aforward';

const URI_WITH_ALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP =
  'mongodb://localhost:27017/?authMechanism=GSSAPI&authSource=%24external&authMechanismProperties=CANONICALIZE_HOST_NAME%3Aforward';

/**
 * @securityTest Automatic Connection Establishment Tests
 *
 * Since this application accepts remote host connection information on the command line,
 * we thoroughly check such arguments to verify that they do not result in surprising
 * behavior for users. In particular, our tests verify that the application warns users
 * about options that seem unusual or may not result in unexpected or dangerous application
 * behavior.
 */
describe('auto connect management', function () {
  let sandbox: sinon.SinonSandbox;
  let preferences: Parameters<typeof getWindowAutoConnectPreferences>[1];
  let fakePreferences: Omit<AutoConnectPreferences, 'shouldAutoConnect'>;

  beforeEach(function () {
    resetForTesting();
    sandbox = sinon.createSandbox();
    fakePreferences = {
      file: '<filename>',
      positionalArguments: ['<arg>'],
      passphrase: '',
      username: '',
      password: '',
    };
    preferences = {
      getPreferences() {
        return fakePreferences;
      },
    };
  });

  afterEach(function () {
    sandbox.restore();
    resetForTesting();
  });

  it('should indicate to the first window that it is supposed to auto-connect', async function () {
    expect(
      await getWindowAutoConnectPreferences({ id: 1 }, preferences)
    ).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(
      await getWindowAutoConnectPreferences({ id: 1 }, preferences)
    ).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      shouldAutoConnect: false,
    });
  });

  it('should allow specifying a fixed url for a browser window', async function () {
    sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CONFIRMED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    registerMongoDbUrlForBrowserWindow({ id: 2 }, 'mongodb://foo');
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      positionalArguments: ['mongodb://foo'],
      shouldAutoConnect: true,
    });
  });

  it('should ignore about: urls', async function () {
    fakePreferences = {
      positionalArguments: ['about:blank'],
    };
    expect(
      await getWindowAutoConnectPreferences({ id: 1 }, preferences)
    ).to.deep.equal({
      shouldAutoConnect: false,
    });
  });

  it('should not auto-connect if no args were passed', async function () {
    fakePreferences = {
      positionalArguments: [],
    };
    expect(
      await getWindowAutoConnectPreferences({ id: 1 }, preferences)
    ).to.deep.equal({
      shouldAutoConnect: false,
    });
  });

  it('should show a warning when connecting from cli with disallowed connection options and cancel', async function () {
    fakePreferences = {
      file: undefined,
      positionalArguments: [
        URI_WITH_DISALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP,
      ],
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      shouldAutoConnect: false,
    });
    expect(stub).to.be.calledOnce;
  });

  it('should show a warning when connecting from cli with disallowed connection options and proceed connection', async function () {
    fakePreferences = {
      file: undefined,
      positionalArguments: [
        URI_WITH_DISALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP,
      ],
      passphrase: '',
      username: '',
      password: '',
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CONFIRMED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(stub).to.be.calledOnce;
  });

  it('should show a warning when connecting from open-url with disallowed connection options', async function () {
    fakePreferences = {
      positionalArguments: [''],
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    registerMongoDbUrlForBrowserWindow(
      { id: 2 },
      URI_WITH_DISALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP
    );
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      shouldAutoConnect: false,
    });
    expect(stub).to.be.calledOnce;
  });

  it('should show a warning when connecting from open-url with disallowed connection options and trustedConnectionString is specified', async function () {
    fakePreferences = {
      file: undefined,
      positionalArguments: [''],
      trustedConnectionString: true,
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    registerMongoDbUrlForBrowserWindow(
      { id: 2 },
      URI_WITH_DISALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP
    );
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      shouldAutoConnect: false,
    });
    expect(stub).to.be.calledOnce;
  });

  it('should not show a warning when trustedConnectionString is specified', async function () {
    const fakePreferencesMinusTrustedConnectionString = {
      file: undefined,
      positionalArguments: [
        URI_WITH_DISALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP,
      ],
      passphrase: '',
      username: '',
      password: '',
    };
    fakePreferences = {
      ...fakePreferencesMinusTrustedConnectionString,
      trustedConnectionString: true,
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      ...fakePreferencesMinusTrustedConnectionString,
      positionalArguments: [
        URI_WITH_DISALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP,
      ],
      shouldAutoConnect: true,
    });
    expect(stub).to.not.be.called;
  });

  it('should not show a warning when authMechanismProperties are correct', async function () {
    fakePreferences = {
      file: undefined,
      positionalArguments: [URI_WITH_ALLOWED_SERVICE_HOST_AUTH_MECHANISM_PROP],
      passphrase: '',
      username: '',
      password: '',
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(stub).to.not.be.called;
  });

  it('should not show a warning if SSL is enabled', async function () {
    fakePreferences = {
      file: undefined,
      positionalArguments: ['mongodb://myserver.com/?ssl=true'],
      passphrase: '',
      username: '',
      password: '',
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(stub).to.not.be.called;
  });

  it('should not show a warning if TLS is enabled', async function () {
    fakePreferences = {
      file: undefined,
      positionalArguments: ['mongodb://myserver.com/?tls=true'],
      passphrase: '',
      username: '',
      password: '',
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(stub).to.not.be.called;
  });

  it('should show a warning if SSL/TLS is disabled and is not localhost', async function () {
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    for await (const host of [
      'myserver',
      'myserver:27017',
      'myserver:27017,localhost:27018',
    ]) {
      fakePreferences = {
        file: undefined,
        positionalArguments: [`mongodb://${host}`],
      };
      expect(
        await getWindowAutoConnectPreferences({ id: 2 }, preferences)
      ).to.deep.equal({
        shouldAutoConnect: false,
      });
    }
    expect(stub).to.be.calledThrice;
  });

  it('should not show a warning if SSL/TLS is disabled and is localhost', async function () {
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    for await (const host of [
      'localhost',
      'localhost:27017',
      'localhost:27017,localhost:27018',
      '127.0.0.1',
      '127.0.0.1:27017',
      '127.0.0.1:27017,127.0.0.1:27018',
      '0.0.0.0',
      '0.0.0.0:27017',
      '0.0.0.0:27017,0.0.0.0:27018',
      'localhost:27017,127.0.0.1:27018,0.0.0.0:27019',
    ]) {
      fakePreferences = {
        file: undefined,
        positionalArguments: [`mongodb://${host}`],
        passphrase: '',
        username: '',
        password: '',
      };
      expect(
        await getWindowAutoConnectPreferences({ id: 2 }, preferences)
      ).to.deep.equal({
        ...fakePreferences,
        shouldAutoConnect: true,
      });
    }
    expect(stub).to.not.be.called;
  });

  it('should show a warning if SSL/TLS is disabled and srv', async function () {
    fakePreferences = {
      positionalArguments: ['mongodb+srv://foo/?tls=false'],
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      shouldAutoConnect: false,
    });
    expect(stub).to.be.calledOnce;
  });

  it('should not show a warning if srv', async function () {
    fakePreferences = {
      file: undefined,
      positionalArguments: ['mongodb+srv://foo/'],
      passphrase: '',
      username: '',
      password: '',
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      ...fakePreferences,
      shouldAutoConnect: true,
    });
    expect(stub).to.be.not.be.called;
  });

  it('should show a warning if fails loose validation', async function () {
    fakePreferences = {
      positionalArguments: ['mongodb+srv://a,b,c/'],
    };
    const stub = sandbox.stub(dialog, 'showMessageBox').resolves({
      response: USER_CANCELED_CONNECTION_ATTEMPT,
    } as MessageBoxReturnValue);
    expect(
      await getWindowAutoConnectPreferences({ id: 2 }, preferences)
    ).to.deep.equal({
      shouldAutoConnect: false,
    });
    expect(stub).to.be.calledOnce;
  });
});
