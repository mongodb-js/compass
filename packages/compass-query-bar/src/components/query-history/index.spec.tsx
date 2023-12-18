import React from 'react';
import { expect } from 'chai';
import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import Sinon from 'sinon';
import fs from 'fs';
import os from 'os';
import QueryHistory from '.';
import {
  FavoriteQueryStorage,
  RecentQueryStorage,
} from '@mongodb-js/my-queries-storage';
import { fetchRecents, fetchFavorites } from '../../stores/query-bar-reducer';
import configureStore from '../../stores/query-bar-store';
import { UUID } from 'bson';

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

function createStore(basepath: string) {
  const favoriteQueryStorage = new FavoriteQueryStorage({ basepath });
  const recentQueryStorage = new RecentQueryStorage({ basepath });

  const store = configureStore({
    namespace: 'airbnb.listings',
    favoriteQueryStorage,
    recentQueryStorage,
    dataProvider: {
      dataProvider: {
        sample() {
          return Promise.resolve([]);
        },
        getConnectionString() {
          return { hosts: [] } as any;
        },
      },
    },
  });

  return {
    store,
    favoriteQueryStorage,
    recentQueryStorage,
  };
}

const renderQueryHistory = (basepath: string) => {
  const data = createStore(basepath);
  render(
    <Provider store={data.store}>
      <QueryHistory
        onUpdateRecentChoosen={() => {}}
        onUpdateFavoriteChoosen={() => {}}
      />
    </Provider>
  );
  return data;
};

describe('query-history', function () {
  let tmpDir: string;
  before(function () {
    tmpDir = fs.mkdtempSync(os.tmpdir());
  });

  after(function () {
    fs.rmdirSync(tmpDir, { recursive: true });
  });

  context('zero state', function () {
    it('in recents', function () {
      renderQueryHistory(tmpDir);
      userEvent.click(screen.getByText(/recents/i));
      expect(
        screen.getByText(/your recent queries will appear here\./i)
      ).to.exist;
    });

    it('in favorites', function () {
      renderQueryHistory(tmpDir);
      userEvent.click(screen.getByText(/favorites/i));
      expect(
        screen.getByText(/your favorite queries will appear here\./i)
      ).to.exist;
    });
  });

  context('renders list of queries', function () {
    it('recent', async function () {
      const { store, recentQueryStorage } = renderQueryHistory(tmpDir);
      Sinon.stub(recentQueryStorage, 'loadAll').returns(
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
      const { store, favoriteQueryStorage } = renderQueryHistory(tmpDir);
      Sinon.stub(favoriteQueryStorage, 'loadAll').returns(
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
      const { store, recentQueryStorage } = renderQueryHistory(tmpDir);
      Sinon.stub(recentQueryStorage, 'loadAll').returns(
        Promise.resolve([RECENT_QUERY] as any)
      );

      await store.dispatch(fetchRecents());

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
      const { store, favoriteQueryStorage } = renderQueryHistory(tmpDir);
      Sinon.stub(favoriteQueryStorage, 'loadAll').returns(
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
      renderQueryHistory(tmpDir);
    Sinon.stub(recentQueryStorage, 'loadAll').returns(
      Promise.resolve([RECENT_QUERY] as any)
    );

    const recentQueryDeleteSpy = Sinon.spy(recentQueryStorage, 'delete');
    const favoriteQueryUpdateSpy = Sinon.spy(
      favoriteQueryStorage,
      'updateAttributes'
    );

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

    expect(favoriteQueryUpdateSpy.calledOnce).to.be.true;
    expect(favoriteQueryUpdateSpy.firstCall.firstArg).to.equal(
      RECENT_QUERY._id
    );

    const favorite = favoriteQueryUpdateSpy.firstCall.lastArg;
    expect(favorite._name).to.equal('compass');
  });
});
