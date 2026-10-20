import sinon from 'sinon';
import { activatePlugin } from './query-bar-store';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { AppRegistry } from '@mongodb-js/compass-app-registry';
import type { PreferencesAccess } from '@mongodb-js/compass-preferences-model';
import { createSandboxFromDefaultPreferences } from '@mongodb-js/compass-preferences-model';
import { expect } from 'chai';
import { waitFor } from '@mongodb-js/testing-library-compass';
import { Long, ObjectId } from 'bson';

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
  function activate(query?: unknown) {
    return activatePlugin(
      { namespace: 'test.coll', query } as any,
      {
        localAppRegistry: new AppRegistry(),
        globalAppRegistry: new AppRegistry(),
        preferences,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        instance: { isWritable: true, on: sinon.stub() },
      } as any,
      {
        on: () => {},
        cleanup: () => {},
      } as any
    ).store;
  }

  it('uses the saved query strings of the initial query', function () {
    const filter = `{
  // a comment
  _id: ObjectId('507f1f77bcf86cd799439011'),
  count: NumberLong('9007199254740993')
}`;
    const { fields } = activate({
      filter,
      sort: "[['count', -1]]",
      limit: 10,
      _id: '0f92b5fa-19fe-4200-a4bb-d25765bce8a2',
      _name: 'favorite',
    }).getState().queryBar;

    expect(fields.filter.string).to.equal(filter);
    expect(fields.filter.value).to.deep.equal({
      _id: new ObjectId('507f1f77bcf86cd799439011'),
      count: Long.fromString('9007199254740993'),
    });
    expect(fields.sort.string).to.equal("[['count', -1]]");
    expect(fields.limit.value).to.equal(10);
    expect(fields.project.string).to.equal('');
  });

  it('supports initial queries with parsed values', function () {
    const { fields } = activate({
      filter: { _id: new ObjectId('507f1f77bcf86cd799439011') },
      project: {},
      limit: 10,
    }).getState().queryBar;

    expect(fields.filter.value).to.deep.equal({
      _id: new ObjectId('507f1f77bcf86cd799439011'),
    });
    expect(fields.filter.valid).to.be.true;
    expect(fields.project.string).to.equal('');
    expect(fields.limit.value).to.equal(10);
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
