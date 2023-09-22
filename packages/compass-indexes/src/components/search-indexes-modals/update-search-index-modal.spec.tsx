import { expect } from 'chai';
import UpdateSearchIndexModal from './update-search-index-modal';
import sinon from 'sinon';
import { Provider } from 'react-redux';

import { render, screen, cleanup } from '@testing-library/react';

import React from 'react';
import {
  getCodemirrorEditorValue,
  setCodemirrorEditorValue,
} from '@mongodb-js/compass-editor';
import {
  refreshSearchIndexes as fetchSearchIndexes,
  showUpdateModal,
} from '../../modules/search-indexes';
import { setupStore } from '../../../test/setup-store';
import { searchIndexes } from '../../../test/fixtures/search-indexes';

const renderModal = async (
  indexName: string,
  updateSearchIndexSpy = sinon.spy()
) => {
  const store = setupStore(
    { namespace: 'test.test', isSearchIndexesSupported: true },
    {
      updateSearchIndex: updateSearchIndexSpy,
      getSearchIndexes: () => Promise.resolve(searchIndexes),
    }
  );
  await store.dispatch(fetchSearchIndexes());
  store.dispatch(showUpdateModal(indexName));
  render(
    <Provider store={store}>
      <UpdateSearchIndexModal />
    </Provider>
  );
  return store;
};

const UPDATE_INDEX = searchIndexes[0];

describe('Update Search Index Modal', function () {
  afterEach(cleanup);

  describe('default behaviour', function () {
    it('renders the modal title', async function () {
      await renderModal(UPDATE_INDEX.name);
      expect(screen.getByText(`Edit "${UPDATE_INDEX.name}" index`)).to.exist;
    });

    it('does not show the input that changes the name of the index', async function () {
      await renderModal(UPDATE_INDEX.name);
      expect(() => screen.getByTestId('name-of-search-index')).to.throw;
    });

    it('uses the provided index definition', async function () {
      await renderModal(UPDATE_INDEX.name);
      const defaultIndexDef = getCodemirrorEditorValue(
        'definition-of-search-index'
      );
      expect(JSON.parse(defaultIndexDef)).to.deep.equal(
        UPDATE_INDEX.latestDefinition
      );
    });
  });

  describe('form validation', function () {
    it('shows server errors', async function () {
      const store = await renderModal(
        UPDATE_INDEX.name,
        sinon.spy(() => {
          throw new Error('InvalidIndexSpecificationOption');
        })
      );
      await setCodemirrorEditorValue(
        'definition-of-search-index',
        `{something: "else"}`
      );
      screen.getByTestId('search-index-submit-button').click();

      expect(store.getState().searchIndexes.updateIndex).to.have.property(
        'error',
        'Invalid index definition.'
      );

      expect(screen.getByText('Invalid index definition.')).to.exist;
    });
  });

  describe('form behaviour', function () {
    it('closes the modal on cancel', async function () {
      const store = await renderModal(
        UPDATE_INDEX.name,
        sinon.spy(() => {
          throw new Error('InvalidIndexSpecificationOption');
        })
      );
      screen.getByText('Cancel').click();
      expect(store.getState().searchIndexes.updateIndex.isModalOpen).to.be
        .false;
    });

    it('submits the modal on update search index', async function () {
      const updateSearchIndexSpy = sinon.spy(() => {
        throw new Error('InvalidIndexSpecificationOption');
      });
      await renderModal(UPDATE_INDEX.name, updateSearchIndexSpy);
      await setCodemirrorEditorValue(
        'definition-of-search-index',
        `{something: "else"}`
      );
      screen.getByTestId('search-index-submit-button').click();
      expect(updateSearchIndexSpy).to.have.been.calledOnceWithExactly(
        'test.test',
        UPDATE_INDEX.name,
        {
          something: 'else',
        }
      );
    });
  });
});
