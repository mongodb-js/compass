import { expect } from 'chai';
import Sinon from 'sinon';
import { CompassAtlasAuthService } from './atlas-auth-service';
import type { AtlasIpcClient } from './renderer';

function getAtlasAuthService(
  ipc: Partial<ReturnType<typeof AtlasIpcClient['getInstance']>>
) {
  const atlasAuthService = new CompassAtlasAuthService();
  (atlasAuthService as any)['atlasIpcClient'] = ipc;
  return atlasAuthService;
}

describe('CompassAtlasAuthService', function () {
  let sandbox: Sinon.SinonSandbox;
  beforeEach(function () {
    sandbox = Sinon.createSandbox();
  });
  afterEach(function () {
    sandbox.restore();
  });

  it('calls isAuthenticated on ipc', async function () {
    const isAuthenticatedStub = sandbox.stub().resolves(true);
    const atlasAuthService = getAtlasAuthService({
      isAuthenticated: isAuthenticatedStub,
    });
    const res = await atlasAuthService.isAuthenticated();
    expect(res).to.be.true;
    expect(isAuthenticatedStub.calledOnce).to.be.true;
  });

  it('calls signOut on ipc', async function () {
    const signOutStub = sandbox.stub();
    const atlasAuthService = getAtlasAuthService({
      signOut: signOutStub,
    });
    await atlasAuthService.signOut();
    expect(signOutStub.calledOnce).to.be.true;
  });

  it('calls signIn on ipc', async function () {
    const signInStub = sandbox.stub();
    const atlasAuthService = getAtlasAuthService({
      signIn: signInStub,
    });
    await atlasAuthService.signIn({ promptType: 'ai-promo-modal' });
    expect(signInStub.calledOnce).to.be.true;
    expect(signInStub.firstCall.firstArg).to.deep.equal({
      promptType: 'ai-promo-modal',
    });
  });

  it('calls getUserInfo on ipc', async function () {
    const getUserInfoStub = sandbox.stub().resolves({ id: 1 });
    const atlasAuthService = getAtlasAuthService({
      getUserInfo: getUserInfoStub,
    });
    const res = await atlasAuthService.getUserInfo();
    expect(res).to.deep.equal({ id: 1 });
    expect(getUserInfoStub.calledOnce).to.be.true;
  });

  it('calls updateUserConfig on ipc', async function () {
    const updateUserConfigStub = sandbox.stub();
    const atlasAuthService = getAtlasAuthService({
      updateAtlasUserConfig: updateUserConfigStub,
    });
    await atlasAuthService.updateUserConfig({ enabledAIFeature: false });
    expect(updateUserConfigStub.calledOnce).to.be.true;
    expect(updateUserConfigStub.firstCall.firstArg).to.deep.equal({
      config: { enabledAIFeature: false },
    });
  });
});
