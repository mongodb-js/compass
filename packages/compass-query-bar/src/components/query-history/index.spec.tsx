import React from 'react';
import { expect } from 'chai';
import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { Provider } from '../../stores/context';
import Sinon from 'sinon';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import QueryHistory from '.';
import {
  FavoriteQueryStorageProvider,
  RecentQueryStorageProvider,
} from '@mongodb-js/my-queries-storage/provider';
import {
  createElectronFavoriteQueryStorage,
  createElectronRecentQueryStorage,
} from '@mongodb-js/my-queries-storage/electron';
import { fetchRecents, fetchFavorites } from '../../stores/query-bar-reducer';
import { configureStore } from '../../stores/query-bar-store';
import { UUID } from 'bson';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';

const BASE_QUERY = {
  filter: { name: 'hello' },
  project: { name: 1 },
  sort: { name: -1 },
  collation: { locale: 'en' },
  skip: 10,
  limit: 20,
};

const RECENT_QUERY = {
  _id: new UUID().toString(),
  _ns: 'sample.airbnb',
  _lastExecuted: new Date(),
  ...BASE_QUERY,
};

const FAVORITE_QUERY = {
  _id: new UUID().toString(),
  _name: 'Best query',
  _lastExecuted: new Date(),
  ...BASE_QUERY,
};

async function createStore(basepath: string) {
  const favoriteQueryStorage = createElectronFavoriteQueryStorage({ basepath });
  const recentQueryStorage = createElectronRecentQueryStorage({ basepath });
  const preferences = await createSandboxFromDefaultPreferences();

  // Create mock objects for required services
  const mockAppRegistry = {} as AppRegistry;
  const mockConnectionInfoRef = {
    current: {
      id: 'TEST',
      title: 'Test Connection',
    },
  } as ConnectionInfoRef;
  const mockAtlasAiService = {} as AtlasAiService;

  const store = configureStore(
    {
      namespace: 'airbnb.listings',
    },
    {
      favoriteQueryStorage,
      recentQueryStorage,
      preferences,
      dataService: {
        sample() {
          return Promise.resolve([]);
        },
        listCollections() {
          return Promise.resolve([]);
        },
        collectionInfo() {
          return Promise.resolve({} as any);
        },
        collectionStats() {
          return Promise.resolve({} as any);
        },
        isListSearchIndexesSupported() {
          return Promise.resolve(true);
        },
      },
      globalAppRegistry: mockAppRegistry,
      localAppRegistry: mockAppRegistry,
      logger: createNoopLogger(),
      track: createNoopTrack(),
      connectionInfoRef: mockConnectionInfoRef,
      atlasAiService: mockAtlasAiService,
      collection: {
        fetchMetadata() {
          return Promise.resolve({});
        },
      } as any,
    }
  );

  return {
    store,
    favoriteQueryStorage,
    recentQueryStorage,
    preferences,
  };
}

const renderQueryHistory = async (basepath: string) => {
  const data = await createStore(basepath);

  const favoriteQueryStorage = {
    getStorage: () => data.favoriteQueryStorage,
  };
  const recentQueryStorage = {
    getStorage: () => data.recentQueryStorage,
  };

  render(
    <FavoriteQueryStorageProvider value={favoriteQueryStorage}>
      <RecentQueryStorageProvider value={recentQueryStorage}>
        <Provider store={data.store}>
          <QueryHistory
            onUpdateRecentChoosen={() => {}}
            onUpdateFavoriteChoosen={() => {}}
          />
        </Provider>
      </RecentQueryStorageProvider>
    </FavoriteQueryStorageProvider>
  );
  return data;
};

describe('query-history', function () {
  let tmpDir: string;
  before(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compass-query-history'));
  });

  after(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  context('zero state', function () {
    it('in recents', async function () {
      await renderQueryHistory(tmpDir);
      userEvent.click(screen.getByText(/recents/i));
      expect(
        screen.getByText(/your recent queries will appear here\./i)
      ).to.exist;
    });

    it('in favorites', async function () {
      await renderQueryHistory(tmpDir);
      userEvent.click(screen.getByText(/favorites/i));
      expect(
        screen.getByText(/your favorite queries will appear here\./i)
      ).to.exist;
    });
  });

  context('renders list of queries', function () {
    it('recent', async function () {
      const { store, recentQueryStorage } = await renderQueryHistory(tmpDir);
      Sinon.stub(recentQueryStorage, 'loadAll').callsFake(() =>
        Promise.resolve([RECENT_QUERY] as any)
      );

      await store.dispatch(fetchRecents());
      userEvent.click(screen.getByText(/recents/i));

      const attrs = screen.getAllByTestId('query-history-query-attribute');
      const labels = attrs.map(
        (attr) =>
          within(attr).getByTestId('query-history-query-label').textContent
      );
      expect(labels.sort()).to.deep.equal(Object.keys(BASE_QUERY).sort());
    });

    it('favorite', async function () {
      const { store, favoriteQueryStorage } = await renderQueryHistory(tmpDir);
      Sinon.stub(favoriteQueryStorage, 'loadAll').callsFake(() =>
        Promise.resolve([FAVORITE_QUERY] as any)
      );

      await store.dispatch(fetchFavorites());
      userEvent.click(screen.getByText(/favorites/i));

      const attrs = screen.getAllByTestId('query-history-query-attribute');
      const labels = attrs.map(
        (attr) =>
          within(attr).getByTestId('query-history-query-label').textContent
      );
      expect(labels.sort()).to.deep.equal(Object.keys(BASE_QUERY).sort());
      expect(screen.getByText(/best query/i)).to.exist;
    });
  });

  context('deletes a query', function () {
    it('recent', async function () {
      const { store, recentQueryStorage } = await renderQueryHistory(tmpDir);
      Sinon.stub(recentQueryStorage, 'loadAll').callsFake(() =>
        Promise.resolve([RECENT_QUERY] as any)
      );

      await store.dispatch(fetchRecents());
      userEvent.click(screen.getByText(/recents/i));

      const spy = Sinon.spy(recentQueryStorage, 'delete');

      const queryCard = screen.getByTestId('recent-query-list-item');
      userEvent.hover(queryCard);

      const deleteButton = within(queryCard).getByTestId(
        'query-history-button-delete-recent'
      );
      userEvent.click(deleteButton);

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.firstArg).to.equal(RECENT_QUERY._id);
    });

    it('favorite', async function () {
      const { store, favoriteQueryStorage } = await renderQueryHistory(tmpDir);
      Sinon.stub(favoriteQueryStorage, 'loadAll').callsFake(() =>
        Promise.resolve([FAVORITE_QUERY] as any)
      );

      await store.dispatch(fetchFavorites());
      userEvent.click(screen.getByText(/favorites/i));

      const spy = Sinon.spy(favoriteQueryStorage, 'delete');

      const queryCard = screen.getByTestId('favorite-query-list-item');
      userEvent.hover(queryCard);

      const deleteButton = within(queryCard).getByTestId(
        'query-history-button-delete-recent'
      );
      userEvent.click(deleteButton);

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.firstArg).to.equal(FAVORITE_QUERY._id);
    });
  });

  it('saves recent query as favorite', async function () {
    const { store, recentQueryStorage, favoriteQueryStorage } =
      await renderQueryHistory(tmpDir);
    Sinon.stub(recentQueryStorage, 'loadAll').callsFake(() =>
      Promise.resolve([RECENT_QUERY] as any)
    );

    const recentQueryDeleteSpy = Sinon.spy(recentQueryStorage, 'delete');
    const favoriteQuerySaveSpy = Sinon.spy(favoriteQueryStorage, 'saveQuery');

    await store.dispatch(fetchRecents());
    userEvent.click(screen.getByText(/recents/i));

    const queryCard = screen.getByTestId('recent-query-list-item');
    userEvent.hover(queryCard);

    const favoriteButton = within(queryCard).getByTestId(
      'query-history-button-fav'
    );
    userEvent.click(favoriteButton);

    const favoriteForm = screen.getByTestId('query-history-favorite-form');
    expect(favoriteForm).to.exist;

    userEvent.type(
      within(favoriteForm).getByTestId('recent-query-save-favorite-name'),
      'compass'
    );
    userEvent.click(
      within(favoriteForm).getByTestId('recent-query-save-favorite-submit')
    );

    await waitForElementToBeRemoved(() =>
      screen.getByTestId('recent-query-list-item')
    );

    expect(recentQueryDeleteSpy.calledOnce).to.be.true;
    expect(recentQueryDeleteSpy.firstCall.firstArg).to.equal(RECENT_QUERY._id);

    expect(favoriteQuerySaveSpy.calledOnce).to.be.true;
    const savedQuery = favoriteQuerySaveSpy.firstCall.firstArg;
    expect(savedQuery._name).to.equal('compass');
  });
});
