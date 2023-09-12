import { expect } from 'chai';
import { DEFAULT_INDEX_DEFINITION } from '.';
import CreateSearchIndexModal from '.';
import sinon from 'sinon';
import { Provider } from 'react-redux';

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';
import { getCodemirrorEditorValue } from '@mongodb-js/compass-editor';
import { openModalForCreation, setError } from '../../modules/search-indexes';
import type { IndexesDataService } from '../../stores/store';
import { setupStore } from '../../../test/setup-store';

describe('Create Search Index Modal', function () {
  let store: ReturnType<typeof setupStore>;
  let dataProvider: Partial<IndexesDataService>;

  beforeEach(function () {
    dataProvider = {
      createSearchIndex: sinon.spy(),
    };

    store = setupStore({ namespace: 'test.test' }, dataProvider);

    store.dispatch(openModalForCreation());

    render(
      <Provider store={store}>
        <CreateSearchIndexModal />
      </Provider>
    );
  });

  afterEach(cleanup);

  describe('default behaviour', function () {
    it('uses "default" as the default index name', function () {
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );

      expect(inputText).to.not.be.null;
      expect(inputText?.value).to.equal('default');
    });

    it('uses a dynamic mapping as the default index definition', function () {
      const defaultIndexDef = getCodemirrorEditorValue(
        'definition-of-search-index'
      );

      expect(defaultIndexDef).to.not.be.null;
      expect(defaultIndexDef).to.equal(DEFAULT_INDEX_DEFINITION);
    });
  });

  describe('form validation', function () {
    it('shows an error when the index name is empty', async function () {
      const inputText: HTMLInputElement = screen.getByTestId(
        'name-of-search-index'
      );

      userEvent.clear(inputText);
      expect(await screen.findByText('Please enter the name of the index.')).to
        .exist;
    });

    it('shows server errors', async function () {
      store.dispatch(setError('InvalidIndexSpecificationOption'));
      expect(store.getState().searchIndexes).to.have.property(
        'error',
        'InvalidIndexSpecificationOption'
      );

      expect(await screen.findByText('Invalid index definition.')).to.exist;
    });
  });

  describe('form behaviour', function () {
    it('closes the modal on cancel', function () {
      const cancelButton: HTMLButtonElement = screen
        .getByText('Cancel')
        .closest('button')!;

      userEvent.click(cancelButton);
      expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be
        .false;
    });

    it('submits the modal on create search index', function () {
      const submitButton: HTMLButtonElement = screen
        .getByTestId('create-search-index-button')
        .closest('button')!;

      userEvent.click(submitButton);
      expect(dataProvider.createSearchIndex).to.have.been.calledOnceWithExactly(
        'test.test',
        'default',
        { mappings: { dynamic: true } }
      );
    });
  });
});
