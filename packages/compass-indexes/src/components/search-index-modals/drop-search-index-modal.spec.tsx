import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { Provider } from 'react-redux';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  showDropSearchIndexModal,
  closeDropSearchIndexModal,
  fetchSearchIndexes,
} from '../../modules/search-indexes';
import type { IndexesDataService } from '../../stores/store';
import DropSearchIndexModal from './drop-search-index-modal';
import { setupStore } from '../../../test/setup-store';
import { searchIndexes } from '../../../test/fixtures/search-indexes';

describe('Drop Search Index Modal', function () {
  let store: ReturnType<typeof setupStore>;
  let dataProvider: Partial<IndexesDataService>;
  let modal: HTMLElement;
  let dropSearchIndexSpy: sinon.SinonSpy;

  beforeEach(async function () {
    dropSearchIndexSpy = sinon.spy();
    dataProvider = {
      getSearchIndexes() {
        return Promise.resolve(searchIndexes);
      },
      dropSearchIndex: dropSearchIndexSpy,
    };

    store = setupStore({ namespace: 'test.test' }, dataProvider);
    await store.dispatch(fetchSearchIndexes());

    render(
      <Provider store={store}>
        <DropSearchIndexModal />
      </Provider>
    );

    // Show the modal
    store.dispatch(showDropSearchIndexModal(searchIndexes[0].name));
    modal = screen.getByTestId('drop-search-index-modal');
    expect(modal).to.exist;
  });

  afterEach(cleanup);

  it('hides the modal', function () {
    store.dispatch(closeDropSearchIndexModal());
    expect(() => screen.getByTestId('drop-search-index-modal')).to.throw;
  });

  it('does not drop the index when name does not match', function () {
    const input = within(modal).getByTestId('confirm-drop-search-index-name');
    userEvent.type(input, 'bla');

    expect(dropSearchIndexSpy.callCount).to.equal(0);

    const button = within(modal).getByTestId('submit-button');
    expect(button.getAttribute('disabled')).to.not.be.null;

    button.click();

    expect(dropSearchIndexSpy.callCount).to.equal(0);
  });

  it('drops indexes when name matches user input', function () {
    const input = within(modal).getByTestId('confirm-drop-search-index-name');
    userEvent.type(input, searchIndexes[0].name);

    expect(dropSearchIndexSpy.callCount).to.equal(0);

    within(modal).getByTestId('submit-button').click();
    expect(dropSearchIndexSpy.callCount).to.equal(1);

    expect(dropSearchIndexSpy.firstCall.args).to.deep.equal([
      'test.test',
      searchIndexes[0].name,
    ]);
  });
});
