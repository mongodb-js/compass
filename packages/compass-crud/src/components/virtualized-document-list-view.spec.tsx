import React from 'react';
import { expect } from 'chai';
import HadronDocument from 'hadron-document';
import {
  screen,
  within,
  act,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import { type VirtualListRef } from '@mongodb-js/compass-components';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { renderWithQueryBar } from '../../test/render-with-query-bar';

import VirtualizedDocumentListView from './virtualized-document-list-view';

const createBigDocument = (variable: number) => ({
  _id: variable,
  name: `Name${variable}`,
  address: `BigDocument Str. ${variable}, 123123 BigCity BigCountry`,
  phone: `${variable}`.repeat(10),
  label: ['Home', 'Work'],
  whatElse: 'Test',
  profession: 'Random Work',
  joiningDate: new Date(),
});

const getDocs = () => [
  {
    _id: 1,
    name: 'Doc1',
  },
  {
    _id: 2,
    name: 'Doc2',
  },
];

describe('VirtualizedDocumentListView', function () {
  let preferences: PreferencesAccess;

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  it('renders the list of provided BSON objects', function () {
    renderWithQueryBar(
      <VirtualizedDocumentListView docs={getDocs()} isEditable={false} />,
      { preferences }
    );

    expect(screen.getByTitle('1')).to.be.visible;
    expect(screen.getByTitle('Doc1')).to.be.visible;
    expect(screen.getByTitle('2')).to.be.visible;
    expect(screen.getByTitle('Doc2')).to.be.visible;
  });

  it('renders the list of provided HadronDocuments', function () {
    renderWithQueryBar(
      <VirtualizedDocumentListView
        docs={getDocs().map((doc) => new HadronDocument(doc))}
        isEditable={false}
      />,
      { preferences }
    );

    expect(screen.getByTitle('1')).to.be.visible;
    expect(screen.getByTitle('Doc1')).to.be.visible;
    expect(screen.getByTitle('2')).to.be.visible;
    expect(screen.getByTitle('Doc2')).to.be.visible;
  });

  it('renders a readonly list when isEditable is false', function () {
    renderWithQueryBar(
      <VirtualizedDocumentListView
        docs={getDocs().map((doc) => new HadronDocument(doc))}
        isEditable={false}
      />,
      { preferences }
    );

    expect(screen.getAllByTestId('readonly-document')).to.have.lengthOf(2);
  });

  it('renders an editable list when isEditable is true', function () {
    renderWithQueryBar(
      <VirtualizedDocumentListView
        docs={getDocs().map((doc) => new HadronDocument(doc))}
        isEditable={true}
      />,
      { preferences }
    );

    expect(screen.getAllByTestId('editable-document')).to.have.lengthOf(2);
  });

  it('preserves document identity across virtualization scrolling', function () {
    const bigDocuments = Array.from(
      { length: 10 },
      (_, idx) => new HadronDocument(createBigDocument(idx))
    );
    const listRef: VirtualListRef = React.createRef();

    renderWithQueryBar(
      <VirtualizedDocumentListView
        docs={bigDocuments}
        isEditable={true}
        listRef={listRef}
        __TEST_OVERSCAN_COUNT={0}
        __TEST_LIST_HEIGHT={178}
      />,
      { preferences }
    );

    const firstDocument = bigDocuments[0];
    const lastDocument = bigDocuments[bigDocuments.length - 1];
    let [firstDocumentElement] = screen.getAllByTestId('editable-document');
    // Verify that we have our first element
    expect(
      within(firstDocumentElement).getByTestId('hadron-document')
    ).to.have.attribute('data-id', firstDocument.uuid);

    // Scroll all the way to the last item
    act(() => {
      listRef.current?.scrollToItem(9);
    });
    const editableDocuments = screen.getAllByTestId('editable-document');
    const lastDocumentElement = editableDocuments[editableDocuments.length - 1];
    // Verify that we have our last element
    expect(
      within(lastDocumentElement).getByTestId('hadron-document')
    ).to.have.attribute('data-id', lastDocument.uuid);

    // Ensure that the first element is not even on screen
    expect(
      within(editableDocuments[0]).getByTestId('hadron-document')
    ).to.not.have.attribute('data-id', firstDocument.uuid);

    // Now scroll all the way back up
    act(() => {
      listRef.current?.scrollToItem(0);
    });

    // Ensure the first element maps back to the same document after recycling
    [firstDocumentElement] = screen.getAllByTestId('editable-document');
    expect(
      within(firstDocumentElement).getByTestId('hadron-document')
    ).to.have.attribute('data-id', firstDocument.uuid);
  });

  it('opens the Update Document modal when a row is edited and follows the underlying document', async function () {
    const openUpdateDocumentModal = sinon.spy();
    const doc = new HadronDocument(createBigDocument(1));
    const { rerender } = renderWithQueryBar(
      <VirtualizedDocumentListView
        docs={[doc]}
        isEditable={true}
        openUpdateDocumentModal={openUpdateDocumentModal}
        __TEST_LIST_HEIGHT={178}
      />,
      { preferences }
    );

    let [documentElement] = screen.getAllByTestId('editable-document');
    userEvent.click(within(documentElement).getByLabelText('Update document'));

    // Editing routes through the modal rather than an inline editor.
    expect(within(documentElement).queryByText('Cancel')).to.not.exist;
    await waitFor(() => {
      expect(openUpdateDocumentModal).to.have.been.calledOnce;
    });
    expect(openUpdateDocumentModal.firstCall.args[0]).to.equal(doc);

    // After a refresh the row reflects the new underlying document and still
    // routes editing through the modal.
    const newDoc = new HadronDocument(createBigDocument(1));
    rerender(
      <VirtualizedDocumentListView
        docs={[newDoc]}
        isEditable={true}
        openUpdateDocumentModal={openUpdateDocumentModal}
        __TEST_LIST_HEIGHT={178}
      />
    );

    [documentElement] = screen.getAllByTestId('editable-document');
    userEvent.click(within(documentElement).getByLabelText('Update document'));
    await waitFor(() => {
      expect(openUpdateDocumentModal).to.have.been.calledTwice;
    });
    expect(openUpdateDocumentModal.secondCall.args[0]).to.equal(newDoc);
  });
});
