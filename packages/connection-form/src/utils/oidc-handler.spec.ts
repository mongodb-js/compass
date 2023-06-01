import { expect } from 'chai';

import { handleUpdateOIDCParam } from './oidc-handler';

describe('#handleUpdateOIDCParam', function () {
  it('should handle updating an oidc option', function () {
    const res = handleUpdateOIDCParam({
      action: {
        type: 'update-oidc-param',
        key: 'allowedFlows',
        value: ['device-auth'],
      },
      connectionOptions: {
        useSystemCA: true,
        oidc: {
          redirectURI: 'https://mongodb.com',
        },
      },
    });
    expect(res).to.deep.equal({
      connectionOptions: {
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
        useSystemCA: true,
        oidc: {
          allowedFlows: ['device-auth'],
          redirectURI: 'https://mongodb.com',
        },
      },
    });
    expect(res).to.deep.equal({
      connectionOptions: {
        useSystemCA: true,
        oidc: {
          redirectURI: 'https://mongodb.com',
        },
      },
    });
  });
});
