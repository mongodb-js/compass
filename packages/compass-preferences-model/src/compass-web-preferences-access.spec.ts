import { expect } from 'chai';
import Sinon from 'sinon';
import { CompassWebPreferencesAccess } from './compass-web-preferences-access';
import { AtlasPreferencesStorage } from './preferences-atlas';
import type { AtlasServiceLike } from '@mongodb-js/compass-user-data';

describe('CompassWebPreferencesAccess', function () {
  let sandbox: Sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('persists user-controlled preferences to the Atlas storage on save', async function () {
    const atlasService: AtlasServiceLike = {
      userDataEndpoint: () => 'https://example.com/ui/userData/AppPreferences',
      userScopedUserDataEndpoint: () =>
        'https://example.com/ui/userData/AppPreferences',
      authenticatedFetch: sandbox.stub(),
    };
    const storage = new AtlasPreferencesStorage(atlasService);
    const updatePreferencesStub = sandbox
      .stub(storage, 'updatePreferences')
      .resolves();

    const access = new CompassWebPreferencesAccess(
      {},
      undefined,
      'atlas',
      storage
    );

    await access.savePreferences({ maxTimeMS: 1000 });

    expect(updatePreferencesStub).to.have.been.calledOnceWith({
      maxTimeMS: 1000,
    });
  });

  it('does not touch the Atlas storage when there is nothing to save', async function () {
    const atlasService: AtlasServiceLike = {
      userDataEndpoint: () => 'https://example.com/ui/userData/AppPreferences',
      userScopedUserDataEndpoint: () =>
        'https://example.com/ui/userData/AppPreferences',
      authenticatedFetch: sandbox.stub(),
    };
    const storage = new AtlasPreferencesStorage(atlasService);
    const updatePreferencesStub = sandbox
      .stub(storage, 'updatePreferences')
      .resolves();

    const access = new CompassWebPreferencesAccess(
      {},
      undefined,
      'atlas',
      storage
    );

    await access.savePreferences({});

    expect(updatePreferencesStub).to.not.have.been.called;
  });
});
