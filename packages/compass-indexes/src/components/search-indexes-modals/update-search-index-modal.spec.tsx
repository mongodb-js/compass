import { expect } from 'chai';
import UpdateSearchIndexModal from './update-search-index-modal';
import sinon from 'sinon';
import { Provider } from 'react-redux';

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';
import { getCodemirrorEditorValue } from '@mongodb-js/compass-editor';
import {
  openModalForUpdate,
  updateIndexFailed,
} from '../../modules/search-indexes';
import type { IndexesDataService } from '../../stores/store';
import { setupStore } from '../../../test/setup-store';

describe('Update Search Index Modal', function () {
  let store: ReturnType<typeof setupStore>;
  let dataProvider: Partial<IndexesDataService>;

  beforeEach(function () {
    dataProvider = {
      updateSearchIndex: sinon.spy(),
    };

    store = setupStore({ namespace: 'test.test' }, dataProvider);

    store.dispatch(openModalForUpdate('indexToUpdate', '{}'));

    render(
      <Provider store={store}>
        <UpdateSearchIndexModal />
      </Provider>
    );
  });

  afterEach(cleanup);

  describe('default behaviour', function () {
    it('uses the provided name as the index name', function () {
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );

      expect(inputText).to.not.be.null;
      expect(inputText?.value).to.equal('indexToUpdate');
    });

    it('uses the provided index definition', function () {
      const defaultIndexDef = getCodemirrorEditorValue(
        'definition-of-search-index'
      );

      expect(defaultIndexDef).to.not.be.null;
      expect(defaultIndexDef).to.equal('{}');
    });
  });

  describe('form validation', function () {
    it('shows server errors', async function () {
      store.dispatch(updateIndexFailed('InvalidIndexSpecificationOption'));
      expect(store.getState().searchIndexes).to.have.property(
        'error',
        'Invalid index definition.'
      );

      expect(await screen.findByText('Invalid index definition.')).to.exist;
    });
  });

  describe('form behaviour', function () {
    it('disables the input that changes the name of the index', function () {
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );

      expect(inputText).to.have.attr('disabled');
    });

    it('closes the modal on cancel', function () {
      const cancelButton: HTMLButtonElement = screen
        .getByText('Cancel')
        .closest('button')!;

      userEvent.click(cancelButton);
      expect(store.getState().searchIndexes.updateIndex.isModalOpen).to.be
        .false;
    });

    it('submits the modal on update search index', function () {
      const submitButton: HTMLButtonElement = screen
        .getByTestId('search-index-submit-button')
        .closest('button')!;

      userEvent.click(submitButton);
      expect(dataProvider.updateSearchIndex).to.have.been.calledOnceWithExactly(
        'test.test',
        'indexToUpdate',
        {}
      );
    });
  });
});
