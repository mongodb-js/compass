import { expect } from 'chai';
import { AtlasCloudAuthService } from './atlas-auth-service';

describe('AtlasCloudAuthService', function () {
  const atlasAuthService = new AtlasCloudAuthService();

  it('should always report the user as authenticated', async function () {
    expect(await atlasAuthService.isAuthenticated()).to.eq(true);
  });

  it('should resolve user info instead of throwing', async function () {
    expect(await atlasAuthService.getUserInfo()).to.deep.eq({ sub: '' });
  });

  it('should resolve when signing in and out', async function () {
    expect(await atlasAuthService.signIn()).to.deep.eq({ sub: '' });
    expect(await atlasAuthService.signOut()).to.eq(undefined);
  });
});
