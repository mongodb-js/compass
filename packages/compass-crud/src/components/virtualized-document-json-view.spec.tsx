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
} from '@mongodb-js/testing-library-compass';
import { type VirtualListRef } from '@mongodb-js/compass-components';

import VirtualizedDocumentJsonView from './virtualized-document-json-view';
import {
  getCodemirrorEditorValue,
  setCodemirrorEditorValue,
} from '@mongodb-js/compass-editor';

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
      expect(() => within(element).getByLabelText('Edit')).to.throw;
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

  it('preserves the state of document when a document goes out of visible viewport when scrolling', function () {
    const bigDocuments = Array.from({ length: 10 }, (_, idx) =>
      createBigDocument(idx)
    );
    const listRef: VirtualListRef = React.createRef();
    render(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={bigDocuments}
        isEditable={true}
        __TEST_OVERSCAN_COUNT={0}
        __TEST_LIST_HEIGHT={178}
        __TEST_LIST_REF={listRef}
      />
    );

    let [firstDocumentElement] = screen.getAllByTestId('editable-json');
    // screen.debug(firstDocumentElement, Infinity);
    // return;
    // Verify that we have our first element
    expect(within(firstDocumentElement).getByText('"Name0"')).to.be.visible;

    // Start editing the document
    userEvent.click(within(firstDocumentElement).getByLabelText('Edit'));

    // Verify that we have an editing state
    expect(within(firstDocumentElement).getByText('Cancel')).to.be.visible;
    expect(within(firstDocumentElement).getByText('Replace')).to.be.visible;

    // Scroll all the way to the last item
    act(() => {
      listRef.current?.scrollToItem(9);
    });
    const editableDocuments = screen.getAllByTestId('editable-json');
    firstDocumentElement = editableDocuments[0];
    const lastDocumentElement = editableDocuments[editableDocuments.length - 1];
    // Verify that we have our last element
    expect(within(lastDocumentElement).getByText('"Name9"')).to.be.visible;

    // Ensure that the first element is not even on screen
    expect(() => within(firstDocumentElement).getByText('"Name0"')).to.throw;

    // Now scroll all the way back up
    act(() => {
      listRef.current?.scrollToItem(0);
    });

    // Ensure that we have our first element and that it is editable
    [firstDocumentElement] = screen.getAllByTestId('editable-json');
    expect(within(firstDocumentElement).getByText('"Name0"')).to.be.visible;

    // Verify that we have an editing state
    expect(within(firstDocumentElement).getByText('Cancel')).to.be.visible;
    expect(within(firstDocumentElement).getByText('Replace')).to.be.visible;
  });

  it('discards the state of document when the underlying document changes', function () {
    const { rerender } = render(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={[createBigDocument(1)]}
        isEditable={true}
        __TEST_LIST_HEIGHT={178}
      />
    );

    let [documentElement] = screen.getAllByTestId('editable-json');

    // Start editing the document
    userEvent.click(within(documentElement).getByLabelText('Edit'));

    // Verify that we have an editing state
    expect(within(documentElement).getByText('Cancel')).to.be.visible;
    expect(within(documentElement).getByText('Replace')).to.be.visible;

    // Mimick a refresh which changes the underlying HadronDocument
    rerender(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={[createBigDocument(1)]}
        isEditable={true}
        __TEST_LIST_HEIGHT={178}
      />
    );

    // Ensure that we have our first element and that it is editable
    [documentElement] = screen.getAllByTestId('editable-json');

    // Verify that we have an editing state
    expect(() => within(documentElement).getByText('Cancel')).to.throw;
    expect(() => within(documentElement).getByText('Replace')).to.throw;
  });

  it('preserves the edit state of document when a document goes out of visible viewport when scrolling', async function () {
    const bigDocuments = Array.from({ length: 20 }, (_, idx) =>
      createBigDocument(idx)
    );
    const listRef: VirtualListRef = React.createRef();
    render(
      <VirtualizedDocumentJsonView
        namespace="x.y"
        docs={bigDocuments}
        isEditable={true}
        __TEST_OVERSCAN_COUNT={0}
        __TEST_LIST_HEIGHT={178}
        __TEST_LIST_REF={listRef}
      />
    );

    let [firstDocumentElement] = screen.getAllByTestId('editable-json');
    // Trigger the edit state (we only set the edited value if the document is being edited)
    userEvent.click(within(firstDocumentElement).getByLabelText('Edit'));

    let cmEditor = firstDocumentElement.querySelector(
      '[data-codemirror="true"]'
    );
    await setCodemirrorEditorValue(cmEditor, '{value: "edited"}');

    // Scroll down and then scroll back up
    act(() => {
      listRef.current?.scrollToItem(15);
    });
    act(() => {
      listRef.current?.scrollToItem(0);
    });

    [firstDocumentElement] = screen.getAllByTestId('editable-json');
    cmEditor = firstDocumentElement.querySelector('[data-codemirror="true"]');

    const value = getCodemirrorEditorValue(cmEditor);
    expect(value).to.equal('{value: "edited"}');
  });
});
