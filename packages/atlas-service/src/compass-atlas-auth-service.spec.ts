import { expect } from 'chai';
import Sinon from 'sinon';
import { CompassAtlasAuthService } from './compass-atlas-auth-service';
import type { CompassAuthService } from './main';

function getAtlasAuthService(ipc: Partial<typeof CompassAuthService>) {
  const atlasAuthService = new CompassAtlasAuthService();
  (atlasAuthService as any)['_ipc'] = ipc;
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
    const c = new AbortController();
    const signInStub = sandbox.stub();
    const atlasAuthService = getAtlasAuthService({
      signIn: signInStub,
    });
    await atlasAuthService.signIn({
      mainProcessSignIn: true,
      signal: c.signal,
    });
    expect(signInStub.calledOnce).to.be.true;
    expect(signInStub.firstCall.firstArg).to.deep.equal({ signal: c.signal });
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
});
