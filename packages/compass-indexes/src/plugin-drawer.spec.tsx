import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import {
  DrawerContentProvider,
  DrawerAnchor,
  useDrawerActions,
} from '@mongodb-js/compass-components/src/components/drawer-portal';
import { IndexesDrawer, INDEXES_DRAWER_ID } from './plugin-drawer';
import { setupStore } from '../test/setup-store';
import {
  OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
  OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW,
} from './modules/indexes-drawer';
import { ActionTypes as SearchIndexActionTypes } from './modules/search-indexes';

function DrawerOpener({ drawerId }: { drawerId?: string }) {
  const actions = useDrawerActions();
  useEffect(() => {
    if (drawerId) {
      actions.openDrawer(drawerId);
    }
  }, [drawerId, actions]);
  return null;
}

function renderDrawer(
  options: {
    preferences?: Record<string, unknown>;
    subTab?: 'Indexes' | undefined;
    storeOptions?: Parameters<typeof setupStore>[0];
    autoOpenDrawerId?: string;
  } = {}
) {
  const store = setupStore(options.storeOptions);

  render(
    <DrawerContentProvider>
      <DrawerAnchor>
        <Provider store={store}>
          <DrawerOpener drawerId={options.autoOpenDrawerId} />
          <IndexesDrawer subTab={options.subTab} />
        </Provider>
      </DrawerAnchor>
    </DrawerContentProvider>,
    {
      preferences: {
        enableSearchActivationProgramP1: true,
        ...options.preferences,
      },
    }
  );

  return store;
}

describe('IndexesDrawer', function () {
  describe('when the feature flag is disabled', function () {
    it('renders nothing', async function () {
      renderDrawer({
        preferences: { enableSearchActivationProgramP1: false },
      });

      await waitFor(() => {
        expect(screen.queryByText('Indexes')).to.not.exist;
      });
    });
  });

  describe('when the feature flag is enabled', function () {
    it('renders the drawer section and shows content when opened', async function () {
      renderDrawer({ autoOpenDrawerId: INDEXES_DRAWER_ID });

      await waitFor(() => {
        expect(screen.getByText('Indexes')).to.exist;
      });
    });
  });

  describe('when on the Indexes tab', function () {
    it('uses the disabled drawer id', function () {
      renderDrawer({ subTab: 'Indexes' });

      // When on the Indexes tab, the drawer uses a different id
      // to prevent it from being opened
      expect(screen.queryByText('Indexes')).to.not.exist;
    });
  });

  describe('when on the indexes-list view', function () {
    it('shows "Indexes" as the title and no back link', async function () {
      renderDrawer({ autoOpenDrawerId: INDEXES_DRAWER_ID });

      await waitFor(() => {
        expect(screen.getByText('Indexes')).to.exist;
      });
      expect(screen.queryByText('Back to All Indexes')).to.not.exist;
    });
  });

  describe('when on the create-search-index view', function () {
    it('shows the "Back to All Indexes" link', async function () {
      const store = renderDrawer({
        autoOpenDrawerId: INDEXES_DRAWER_ID,
      });

      await waitFor(() => {
        expect(screen.getByText('Indexes')).to.exist;
      });

      store.dispatch({
        type: OPEN_CREATE_SEARCH_INDEX_DRAWER_VIEW,
        currentIndexType: 'search',
      });

      await waitFor(() => {
        expect(screen.getByText('Back to All Indexes')).to.exist;
      });
    });
  });

  describe('when on the edit-search-index view', function () {
    it('shows the "Back to All Indexes" link', async function () {
      const store = renderDrawer({
        autoOpenDrawerId: INDEXES_DRAWER_ID,
      });

      await waitFor(() => {
        expect(screen.getByText('Indexes')).to.exist;
      });

      // Seed the store with a search index so the edit view can find it
      store.dispatch({
        type: SearchIndexActionTypes.FetchSearchIndexesSucceeded,
        indexes: [
          {
            name: 'testIndex',
            type: 'search',
            status: 'READY',
            queryable: true,
            latestDefinition: { mappings: { dynamic: true } },
          },
        ],
      });

      store.dispatch({
        type: OPEN_EDIT_SEARCH_INDEX_DRAWER_VIEW,
        currentIndexName: 'testIndex',
      });

      await waitFor(() => {
        expect(screen.getByText('Back to All Indexes')).to.exist;
      });
    });
  });
});
