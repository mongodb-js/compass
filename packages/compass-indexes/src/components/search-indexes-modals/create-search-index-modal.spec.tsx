import { expect } from 'chai';
import { DEFAULT_INDEX_DEFINITION } from './create-search-index-modal';
import CreateSearchIndexModal from './create-search-index-modal';
import sinon from 'sinon';
import { Provider } from 'react-redux';

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';
import { getCodemirrorEditorValue } from '@mongodb-js/compass-editor';
import { showCreateModal } from '../../modules/search-indexes';
import { setupStore } from '../../../test/setup-store';

const renderModal = (createSearchIndexSpy = sinon.spy()) => {
  const store = setupStore(
    { namespace: 'test.test', isSearchIndexesSupported: true },
    {
      createSearchIndex: createSearchIndexSpy,
    }
  );
  store.dispatch(showCreateModal());
  render(
    <Provider store={store}>
      <CreateSearchIndexModal />
    </Provider>
  );
  return store;
};

describe('Create Search Index Modal', function () {
  afterEach(cleanup);

  describe('default behaviour', function () {
    it('renders correct modal title', function () {
      renderModal();
      expect(
        screen.getByText('Create Search Index', {
          selector: 'h1',
        })
      ).to.exist;
    });

    it('shows default index name', function () {
      renderModal();
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );
      expect(inputText.value).to.equal('default');
    });

    it('shows default index definition', function () {
      renderModal();
      const defaultIndexDef = getCodemirrorEditorValue(
        'definition-of-search-index'
      );
      expect(defaultIndexDef).to.not.be.null;
      expect(defaultIndexDef).to.equal(DEFAULT_INDEX_DEFINITION);
    });
  });

  describe('form validation', function () {
    it('shows an error when the index name is empty', async function () {
      renderModal();
      const inputText = screen.getByTestId('name-of-search-index');

      userEvent.clear(inputText);
      expect(await screen.findByText('Please enter the name of the index.')).to
        .exist;
    });

    it('shows server errors', function () {
      const store = renderModal(
        sinon.spy(() => {
          throw new Error('Data is invalid');
        })
      );
      store.dispatch(showCreateModal());
      screen.getByTestId('search-index-submit-button').click();
      expect(store.getState().searchIndexes.createIndex).to.have.property(
        'error',
        'Data is invalid'
      );

      expect(screen.getByText('Data is invalid')).to.exist;
    });
  });

  describe('form behaviour', function () {
    it('closes the modal on cancel', function () {
      const store = renderModal();
      screen.getByText('Cancel').click();
      expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be
        .false;
    });

    it('submits the modal on create search index', function () {
      const createSearchIndexSpy = sinon.spy();
      renderModal(createSearchIndexSpy);
      screen.getByTestId('search-index-submit-button').click();
      expect(createSearchIndexSpy).to.have.been.calledOnceWithExactly(
        'test.test',
        'default',
        { mappings: { dynamic: true } }
      );
    });
  });
});
