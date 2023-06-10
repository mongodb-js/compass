import { expect } from 'chai';
import sinon from 'sinon';
import preferences from 'compass-preferences-model';

import {
  adjustOIDCConnectionOptionsBeforeConnect,
  handleUpdateOIDCParam,
} from './oidc-handler';

describe('#handleUpdateOIDCParam', function () {
  it('should handle updating an oidc option', function () {
    const res = handleUpdateOIDCParam({
      action: {
        type: 'update-oidc-param',
        key: 'allowedFlows',
        value: ['device-auth'],
      },
      connectionOptions: {
        connectionString: 'http://localhost:27017',
        useSystemCA: true,
        oidc: {
          redirectURI: 'https://mongodb.com',
        },
      },
    });
    expect(res).to.deep.equal({
      connectionOptions: {
        connectionString: 'http://localhost:27017',
        useSystemCA: true,
        oidc: {
          allowedFlows: ['device-auth'],
          redirectURI: 'https://mongodb.com',
        },
      },
    });
  });

  it('should handle resetting an oidc option', function () {
    const res = handleUpdateOIDCParam({
      action: {
        type: 'update-oidc-param',
        key: 'allowedFlows',
        value: undefined,
      },
      connectionOptions: {
        connectionString: 'http://localhost:27017',
        useSystemCA: true,
        oidc: {
          allowedFlows: ['device-auth'],
          redirectURI: 'https://mongodb.com',
        },
      },
    });
    expect(res).to.deep.equal({
      connectionOptions: {
        connectionString: 'http://localhost:27017',
        useSystemCA: true,
        oidc: {
          redirectURI: 'https://mongodb.com',
        },
      },
    });
  });
});

// eslint-disable-next-line mocha/max-top-level-suites
describe('#adjustOIDCConnectionOptionsBeforeConnect', function () {
  it('returns oidc options with notify device flow when supplied', function () {
    const notifyDeviceFlowMock = () => {};

    const result = adjustOIDCConnectionOptionsBeforeConnect(
      notifyDeviceFlowMock
    )({
      connectionString: 'http://localhost:27017',
      useSystemCA: true,
      oidc: {
        redirectURI: 'https://mongodb.com',
      },
    });

    expect(result).to.deep.equal({
      connectionString: 'http://localhost:27017',
      useSystemCA: true,
      oidc: {
        redirectURI: 'https://mongodb.com',
        notifyDeviceFlow: notifyDeviceFlowMock,
      },
    });
  });

  it('returns oidc options without notify device flow when not supplied', function () {
    const result = adjustOIDCConnectionOptionsBeforeConnect()({
      connectionString: 'http://localhost:27017',
      useSystemCA: true,
      oidc: {
        redirectURI: 'https://mongodb.com',
      },
    });

    expect(result).to.deep.equal({
      connectionString: 'http://localhost:27017',
      useSystemCA: true,
      oidc: {
        redirectURI: 'https://mongodb.com',
      },
    });
  });

  describe('with the `browserCommandForOIDCAuth` preference set', function () {
    let sandbox: sinon.SinonSandbox;
    let getPreferencesStub: sinon.SinonStub;
    const mockBrowserCommand = '/usr/bin/browser';

    beforeEach(function () {
      sandbox = sinon.createSandbox();
      getPreferencesStub = sinon.stub();
      getPreferencesStub.returns({
        browserCommandForOIDCAuth: mockBrowserCommand,
      });
      sandbox
        .stub(preferences, 'getPreferences')
        .callsFake(() => getPreferencesStub());
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('returns oidc options with the browser command from settings when set', function () {
      const result = adjustOIDCConnectionOptionsBeforeConnect()({
        connectionString: 'http://localhost:27017',
        useSystemCA: true,
        oidc: {
          redirectURI: 'https://mongodb.com',
        },
      });

      expect(result).to.deep.equal({
        connectionString: 'http://localhost:27017',
        useSystemCA: true,
        oidc: {
          redirectURI: 'https://mongodb.com',
          openBrowser: {
            command: `${mockBrowserCommand}`,
          },
        },
      });
    });
  });
});
