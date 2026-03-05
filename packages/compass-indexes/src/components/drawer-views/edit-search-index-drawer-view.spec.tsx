import React from 'react';
import { Provider } from 'react-redux';
import {
  cleanup,
  render,
  screen,
  act,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import EditSearchIndexDrawerView from './edit-search-index-drawer-view';
import { setupStore } from '../../../test/setup-store';
import type { RootState } from '../../modules';
import { mockSearchIndex } from '../../../test/helpers';

const renderEditSearchIndexDrawerView = (
  stateOverrides: Partial<RootState> = {}
) => {
  const store = setupStore();

  // Apply state overrides
  const state = store.getState();
  const newState = {
    ...state,
    indexesDrawer: {
      ...state.indexesDrawer,
      currentView: 'edit-search-index' as const,
      currentIndexName: 'testIndex',
      isDirty: false,
    },
    searchIndexes: {
      ...state.searchIndexes,
      indexes: [
        mockSearchIndex({
          name: 'testIndex',
          status: 'READY',
          queryable: true,
          latestDefinition: {
            mappings: {
              dynamic: true,
            },
          },
        }),
      ],
      updateIndex: {
        isModalOpen: false,
        isBusy: false,
        indexName: 'testIndex',
      },
    },
    ...stateOverrides,
  };
  Object.assign(store.getState(), newState);

  render(
    <Provider store={store}>
      <EditSearchIndexDrawerView />
    </Provider>
  );

  return store;
};

describe('EditSearchIndexDrawerView', function () {
  afterEach(function () {
    act(() => {
      cleanup();
    });
    sinon.restore();
  });

  describe('when rendered for search index', function () {
    it('renders the edit search index form', function () {
      renderEditSearchIndexDrawerView();

      expect(screen.getByTestId('edit-search-index-drawer-view')).to.exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-title')).to
        .exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-index-name')).to
        .exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-editor')).to
        .exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-cancel-button'))
        .to.exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-submit-button'))
        .to.exist;
    });

    it('shows the index status badge', function () {
      renderEditSearchIndexDrawerView();

      expect(screen.getByTestId('edit-search-index-drawer-view-status')).to
        .exist;
    });

    it('shows the queryable badge', function () {
      renderEditSearchIndexDrawerView();

      expect(
        screen.getByTestId('edit-search-index-drawer-view-queryable-badge')
      ).to.exist;
      expect(
        screen.getByTestId('edit-search-index-drawer-view-queryable-badge')
          .textContent
      ).to.equal('Queryable');
    });

    it('shows the Search Index badge', function () {
      renderEditSearchIndexDrawerView();

      expect(
        screen.getByTestId('edit-search-index-drawer-view-index-type-badge')
      ).to.exist;
      expect(
        screen.getByTestId('edit-search-index-drawer-view-index-type-badge')
          .textContent
      ).to.equal('Search Index');
    });
  });

  describe('when rendered for vector search index', function () {
    it('renders the edit vector search index form', function () {
      renderEditSearchIndexDrawerView({
        searchIndexes: {
          status: 'READY',
          indexes: [
            mockSearchIndex({
              name: 'vectorIndex',
              type: 'vectorSearch',
              status: 'READY',
              queryable: true,
              latestDefinition: {
                fields: [],
              },
            }),
          ],
          createIndex: {
            isModalOpen: false,
            isBusy: false,
          },
          updateIndex: {
            isModalOpen: false,
            isBusy: false,
            indexName: 'vectorIndex',
          },
        },
        indexesDrawer: {
          currentView: 'edit-search-index',
          currentIndexName: 'vectorIndex',
          currentIndexType: 'search',
          isDirty: false,
        },
      });

      expect(screen.getByTestId('edit-search-index-drawer-view')).to.exist;
      expect(
        screen.getByTestId('edit-search-index-drawer-view-title').textContent
      ).to.include('Vector Search Index');
      expect(
        screen.getByTestId('edit-search-index-drawer-view-index-type-badge')
          .textContent
      ).to.equal('Vector Search Index');
    });
  });

  describe('when busy', function () {
    it('disables submit button when busy', function () {
      renderEditSearchIndexDrawerView({
        searchIndexes: {
          status: 'READY',
          indexes: [
            mockSearchIndex({
              name: 'testIndex',
              status: 'READY',
              queryable: true,
              latestDefinition: {
                mappings: {
                  dynamic: true,
                },
              },
            }),
          ],
          createIndex: {
            isModalOpen: false,
            isBusy: false,
          },
          updateIndex: {
            isModalOpen: false,
            isBusy: true,
            indexName: 'testIndex',
          },
        },
      });

      const submitButton = screen.getByTestId(
        'edit-search-index-drawer-view-submit-button'
      );
      // LeafyGreen Button sets aria-disabled="true" when isLoading is true
      expect(submitButton).to.have.attribute('aria-disabled', 'true');
    });
  });

  describe('save button state', function () {
    it('disables submit button when definition has not changed', function () {
      renderEditSearchIndexDrawerView();

      const submitButton = screen.getByTestId(
        'edit-search-index-drawer-view-submit-button'
      );
      // Button is disabled because definition hasn't changed
      expect(submitButton).to.have.attribute('aria-disabled', 'true');
    });
  });
});
