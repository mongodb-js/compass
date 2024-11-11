import sinon from 'sinon';
import { activatePlugin } from './query-bar-store';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { AppRegistry } from 'hadron-app-registry';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { expect } from 'chai';
import { waitFor } from '@mongodb-js/testing-library-compass';
describe('createQueryWithHistoryAutocompleter', function () {
  let preferences: PreferencesAccess;
  let loadAllStub: sinon.SinonStub;
  beforeEach(async function () {
    loadAllStub = sinon.stub();
    preferences = await createSandboxFromDefaultPreferences();
  });
  afterEach(function () {
    sinon.restore();
  });
  it('calls fetchSavedQueries when activatePlugin is called', async function () {
    const mockService = {
      getQueryFromUserInput: sinon
        .stub()
        .resolves({ content: { query: { filter: '{_id: 1}' } } }),
    };
    const mockDataService = {
      sample: sinon.stub().resolves([{ _id: 42 }]),
      getConnectionString: sinon.stub().returns({
        hosts: ['localhost:27017'],
      }),
    };
    activatePlugin(
      {
        namespace: 'test.coll',
        isReadonly: true,
        serverVersion: '6.0.0',
        isSearchIndexesSupported: true,
        isTimeSeries: false,
        isClustered: false,
        isFLE: false,
        isDataLake: false,
        isAtlas: false,
      },
      {
        localAppRegistry: new AppRegistry(),
        globalAppRegistry: new AppRegistry(),
        dataService: mockDataService,
        recentQueryStorageAccess: {
          getStorage: () => ({
            loadAll: loadAllStub,
          }),
        },
        favoriteQueryStorageAccess: {
          getStorage: () => ({
            loadAll: loadAllStub,
          }),
        },
        atlasAiService: mockService,
        preferences,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        instance: { isWritable: true, on: sinon.stub() },
      } as any,
      {
        on: () => {},
        cleanup: () => {},
      } as any
    );
    await waitFor(() => {
      expect(loadAllStub).to.have.been.calledTwice;
    });
  });
});
