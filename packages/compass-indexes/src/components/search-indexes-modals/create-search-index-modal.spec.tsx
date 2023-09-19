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
    { namespace: 'test.test' },
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
    it('uses "default" as the default index name', function () {
      renderModal();
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );

      expect(inputText).to.not.be.null;
      expect(inputText?.value).to.equal('default');
    });

    it('uses a dynamic mapping as the default index definition', function () {
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
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );

      userEvent.clear(inputText);
      expect(await screen.findByText('Please enter the name of the index.')).to
        .exist;
    });

    it('shows server errors', async function () {
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

      expect(await screen.findByText('Data is invalid')).to.exist;
    });
  });

  describe('form behaviour', function () {
    it('closes the modal on cancel', function () {
      const store = renderModal();
      const cancelButton: HTMLButtonElement = screen
        .getByText('Cancel')
        .closest('button')!;

      userEvent.click(cancelButton);
      expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be
        .false;
    });

    it('submits the modal on create search index', function () {
      const createSearchIndexSpy = sinon.spy();
      renderModal(createSearchIndexSpy);
      const submitButton: HTMLButtonElement = screen
        .getByTestId('search-index-submit-button')
        .closest('button')!;

      userEvent.click(submitButton);
      expect(createSearchIndexSpy).to.have.been.calledOnceWithExactly(
        'test.test',
        'default',
        { mappings: { dynamic: true } }
      );
    });
  });
});
