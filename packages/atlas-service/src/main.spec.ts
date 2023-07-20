import Sinon from 'sinon';
import { expect } from 'chai';
import { AtlasService } from './main';

describe('AtlasServiceMain', function () {
  const sandbox = Sinon.createSandbox();

  const mockOidcPlugin = {
    mongoClientOptions: {
      authMechanismProperties: {
        REQUEST_TOKEN_CALLBACK: sandbox
          .stub()
          .resolves({ accessToken: '1234' }),
        REFRESH_TOKEN_CALLBACK: sandbox
          .stub()
          .resolves({ accessToken: '1234' }),
      },
    },
    logger: {} as any,
    serialize: sandbox.stub(),
    destroy: sandbox.stub(),
  };

  AtlasService['plugin'] = mockOidcPlugin;

  const issuer = process.env.COMPASS_OIDC_ISSUER;
  const clientId = process.env.COMPASS_CLIENT_ID;

  before(function () {
    process.env.COMPASS_OIDC_ISSUER = 'http://example.com';
    process.env.COMPASS_CLIENT_ID = '1234abcd';
  });

  after(function () {
    process.env.COMPASS_OIDC_ISSUER = issuer;
    process.env.COMPASS_CLIENT_ID = clientId;
  });

  afterEach(function () {
    AtlasService['token'] = null;
    sandbox.resetHistory();
  });

  it('should sign in using oidc plugin', async function () {
    const token = await AtlasService.signIn();
    expect(
      mockOidcPlugin.mongoClientOptions.authMechanismProperties
        .REQUEST_TOKEN_CALLBACK
    ).to.have.been.calledOnce;
    expect(token).to.have.property('accessToken', '1234');
  });

  it('should debounce inflight sign in requests', async function () {
    void AtlasService.signIn();
    void AtlasService.signIn();
    void AtlasService.signIn();
    void AtlasService.signIn();

    await AtlasService.signIn();

    expect(
      mockOidcPlugin.mongoClientOptions.authMechanismProperties
        .REQUEST_TOKEN_CALLBACK
    ).to.have.been.calledOnce;
  });

  it('should throw if COMPASS_OIDC_ISSUER is not set', async function () {
    delete process.env.COMPASS_OIDC_ISSUER;

    try {
      await AtlasService.signIn();
      expect.fail('Expected AtlasService.signIn() to throw');
    } catch (err) {
      expect(err).to.have.property(
        'message',
        'COMPASS_OIDC_ISSUER is required'
      );
    }
  });

  it('should throw if COMPASS_CLIENT_ID is not set', async function () {
    delete process.env.COMPASS_CLIENT_ID;

    try {
      await AtlasService.signIn();
      expect.fail('Expected AtlasService.signIn() to throw');
    } catch (err) {
      expect(err).to.have.property('message', 'COMPASS_CLIENT_ID is required');
    }
  });
});
