import React from 'react';
import { Provider } from 'react-redux';
import {
  cleanup,
  render,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import CreateSearchIndexDrawerView from './create-search-index-drawer-view';
import { setupStore } from '../../../test/setup-store';
import type { RootState } from '../../modules';

const renderCreateSearchIndexDrawerView = (
  stateOverrides: Partial<RootState> = {}
) => {
  const store = setupStore();

  // Apply state overrides
  const state = store.getState();
  const newState = {
    ...state,
    indexesDrawer: {
      ...state.indexesDrawer,
      currentView: 'create-search-index' as const,
      currentIndexType: 'search' as const,
      isEditing: false,
    },
    searchIndexes: {
      ...state.searchIndexes,
      createIndex: {
        isModalOpen: false,
        isBusy: false,
      },
    },
    ...stateOverrides,
  };
  Object.assign(store.getState(), newState);

  render(
    <Provider store={store}>
      <CreateSearchIndexDrawerView />
    </Provider>
  );

  return store;
};

describe('CreateSearchIndexDrawerView', function () {
  afterEach(function () {
    cleanup();
    sinon.restore();
  });

  describe('when rendered for search index', function () {
    it('renders the create search index form', function () {
      renderCreateSearchIndexDrawerView();

      expect(screen.getByTestId('create-search-index-drawer-view')).to.exist;
      expect(screen.getByTestId('create-search-index-drawer-view-title')).to
        .exist;
      expect(screen.getByTestId('create-search-index-drawer-view-name-input'))
        .to.exist;
      expect(screen.getByTestId('create-search-index-drawer-view-editor')).to
        .exist;
      expect(
        screen.getByTestId('create-search-index-drawer-view-cancel-button')
      ).to.exist;
      expect(
        screen.getByTestId('create-search-index-drawer-view-submit-button')
      ).to.exist;
    });

    it('has default index name set to "default"', function () {
      renderCreateSearchIndexDrawerView();

      const nameInput = screen.getByTestId(
        'create-search-index-drawer-view-name-input'
      ) as HTMLInputElement;
      expect(nameInput.value).to.equal('default');
    });

    it('shows the definition editor', function () {
      renderCreateSearchIndexDrawerView();

      const editor = screen.getByTestId(
        'create-search-index-drawer-view-editor'
      );
      expect(editor).to.exist;
      // The editor contains the template content (with line numbers prepended)
      expect(editor.textContent).to.include('mappings');
    });
  });

  describe('when rendered for vector search index', function () {
    it('renders the create vector search index form', function () {
      renderCreateSearchIndexDrawerView({
        indexesDrawer: {
          currentView: 'create-search-index',
          currentIndexType: 'vectorSearch',
          currentIndexName: '',
          isEditing: false,
        },
      });

      expect(screen.getByTestId('create-search-index-drawer-view')).to.exist;
      expect(
        screen.getByTestId('create-search-index-drawer-view-title').textContent
      ).to.include('Vector Search Index');
      expect(
        screen.getByTestId('create-search-index-drawer-view-submit-button')
      ).to.exist;
    });

    it('has default index name set to "vector_index"', function () {
      renderCreateSearchIndexDrawerView({
        indexesDrawer: {
          currentView: 'create-search-index',
          currentIndexType: 'vectorSearch',
          currentIndexName: '',
          isEditing: false,
        },
      });

      const nameInput = screen.getByTestId(
        'create-search-index-drawer-view-name-input'
      ) as HTMLInputElement;
      expect(nameInput.value).to.equal('vector_index');
    });
  });

  describe('form validation', function () {
    it('shows error when index name is empty', async function () {
      renderCreateSearchIndexDrawerView();

      const nameInput = screen.getByTestId(
        'create-search-index-drawer-view-name-input'
      );
      await userEvent.clear(nameInput);

      expect(screen.getByText('Please enter the name of the index.')).to.exist;
    });
  });

  describe('when busy', function () {
    it('disables submit button when busy', function () {
      renderCreateSearchIndexDrawerView({
        searchIndexes: {
          status: 'READY',
          indexes: [],
          createIndex: {
            isModalOpen: false,
            isBusy: true,
          },
          updateIndex: {
            isModalOpen: false,
            isBusy: false,
            indexName: '',
          },
        },
      });

      const submitButton = screen.getByTestId(
        'create-search-index-drawer-view-submit-button'
      );
      // LeafyGreen Button sets aria-disabled="true" when isLoading is true
      expect(submitButton).to.have.attribute('aria-disabled', 'true');
    });

    it('enables submit button when not busy', function () {
      renderCreateSearchIndexDrawerView({
        searchIndexes: {
          status: 'READY',
          indexes: [],
          createIndex: {
            isModalOpen: false,
            isBusy: false,
          },
          updateIndex: {
            isModalOpen: false,
            isBusy: false,
            indexName: '',
          },
        },
      });

      const submitButton = screen.getByTestId(
        'create-search-index-drawer-view-submit-button'
      );
      expect(submitButton).to.have.attribute('aria-disabled', 'false');
    });
  });
});
