import React from 'react';
import { expect } from 'chai';
import HadronDocument from 'hadron-document';
import {
  render,
  screen,
  cleanup,
  within,
  act,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import { type VirtualListRef } from '@mongodb-js/compass-components';

import VirtualizedDocumentJsonView from './virtualized-document-json-view';

const createBigDocument = (variable: number) =>
  new HadronDocument({
    _id: variable,
    name: `Name${variable}`,
    address: `BigDocument Str. ${variable}, 123123 BigCity BigCountry`,
    phone: `${variable}`.repeat(10),
    label: ['Home', 'Work'],
    whatElse: 'Test',
    profession: 'Random Work',
    joiningDate: new Date(),
  });

const getDocs = () =>
  [
    {
      _id: 1,
      name: 'Doc1',
    },
    {
      _id: 2,
      name: 'Doc2',
    },
  ].map((k) => new HadronDocument(k));

describe('VirtualizedDocumentJsonView', function () {
  afterEach(function () {
    cleanup();
  });

  it('renders a readonly list when isEditable is false', function () {
    render(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={getDocs()}
        isEditable={false}
      />
    );

    // They are having test ids of editable-json but are not actually editable
    const jsonElements = screen.getAllByTestId('editable-json');
    expect(jsonElements).to.have.lengthOf(2);
    for (const element of jsonElements) {
      expect(() => within(element).getByLabelText('Edit')).to.throw();
    }
  });

  it('renders an editable list when isEditable is true', function () {
    render(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={getDocs()}
        isEditable={true}
      />
    );

    // They are having test ids of editable-json but are not actually editable
    const jsonElements = screen.getAllByTestId('editable-json');
    expect(jsonElements).to.have.lengthOf(2);
    for (const element of jsonElements) {
      expect(within(element).getByLabelText('Edit')).to.be.visible;
    }
  });

  it('preserves the rendered document across virtualization scrolling', function () {
    const bigDocuments = Array.from({ length: 10 }, (_, idx) =>
      createBigDocument(idx)
    );
    const listRef: VirtualListRef = React.createRef();
    render(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={bigDocuments}
        isEditable={true}
        listRef={listRef}
        __TEST_OVERSCAN_COUNT={0}
        __TEST_LIST_HEIGHT={178}
      />
    );

    let [firstDocumentElement] = screen.getAllByTestId('editable-json');
    // Verify that we have our first element
    expect(within(firstDocumentElement).getByText('"Name0"')).to.be.visible;

    // Scroll all the way to the last item
    act(() => {
      listRef.current?.scrollToItem(9);
    });
    const editableDocuments = screen.getAllByTestId('editable-json');
    const lastDocumentElement = editableDocuments[editableDocuments.length - 1];
    // Verify that we have our last element
    expect(within(lastDocumentElement).getByText('"Name9"')).to.be.visible;

    // Ensure that the first element is not even on screen
    expect(() => within(editableDocuments[0]).getByText('"Name0"')).to.throw();

    // Now scroll all the way back up
    act(() => {
      listRef.current?.scrollToItem(0);
    });

    // Ensure that the first element is rendered again after recycling
    [firstDocumentElement] = screen.getAllByTestId('editable-json');
    expect(within(firstDocumentElement).getByText('"Name0"')).to.be.visible;
  });

  it('opens the Update Document modal when a row is edited (no inline editing)', async function () {
    const openUpdateDocumentModal = sinon.spy();
    const docs = [createBigDocument(1)];
    render(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={docs}
        isEditable={true}
        openUpdateDocumentModal={openUpdateDocumentModal}
        __TEST_LIST_HEIGHT={178}
      />
    );

    const [documentElement] = screen.getAllByTestId('editable-json');
    userEvent.click(within(documentElement).getByLabelText('Edit'));

    // Editing routes through the modal rather than an inline editor.
    expect(within(documentElement).queryByText('Cancel')).to.not.exist;
    await waitFor(() => {
      expect(openUpdateDocumentModal).to.have.been.calledOnce;
    });
    expect(openUpdateDocumentModal.firstCall.args[0]).to.equal(docs[0]);
  });

  it('keeps rows interactive after virtualization recycle', async function () {
    const openUpdateDocumentModal = sinon.spy();
    const bigDocuments = Array.from({ length: 20 }, (_, idx) =>
      createBigDocument(idx)
    );
    const listRef: VirtualListRef = React.createRef();
    render(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={bigDocuments}
        isEditable={true}
        openUpdateDocumentModal={openUpdateDocumentModal}
        listRef={listRef}
        __TEST_OVERSCAN_COUNT={0}
        __TEST_LIST_HEIGHT={178}
      />
    );

    // Scroll the first row out of view and back so it is recycled.
    act(() => {
      listRef.current?.scrollToItem(15);
    });
    act(() => {
      listRef.current?.scrollToItem(0);
    });

    const [firstDocumentElement] = screen.getAllByTestId('editable-json');
    userEvent.click(within(firstDocumentElement).getByLabelText('Edit'));

    // The recycled row is still functional and routes editing to the modal.
    await waitFor(() => {
      expect(openUpdateDocumentModal).to.have.been.calledOnce;
    });
    expect(openUpdateDocumentModal.firstCall.args[0]).to.equal(bigDocuments[0]);
  });
});
