import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import InsertDocumentDialog from './insert-document-dialog';
import HadronDocument from 'hadron-document';
import { setCodemirrorEditorValue } from '@mongodb-js/compass-editor';

const noop = () => {};
const defaultProps = {
  closeInsertDocumentDialog: noop,
  insertDocument: noop,
  insertMany: noop,
  toggleInsertDocumentView: noop,
  isCommentNeeded: false,
  csfleState: { state: 'none' },
  isOpen: true,
  ns: 'airbnb.listings',
  updateComment: noop,
  error: null,
} as unknown as ComponentProps<typeof InsertDocumentDialog>;

describe('InsertDocumentDialog', function () {
  it('show error message for invalid EJSON', async function () {
    let jsonDoc = '{}';
    const doc = new HadronDocument({});
    doc.editing = true;
    function updateJsonDoc(value: string | null) {
      doc.setModifiedEJSONString(value);
      jsonDoc = value ?? '{}';
    }
    const { rerender } = render(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        jsonDoc={jsonDoc}
        updateJsonDoc={updateJsonDoc}
        insertView="json"
      />
    );
    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-json-editor'),
      '{ "invalid_long": { "$numberLong": "1234567234324812317654321" } } '
    );
    rerender(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        jsonDoc={jsonDoc}
        updateJsonDoc={updateJsonDoc}
        insertView="json"
      />
    );
    const errorMessage = await screen.findByText(
      /numberLong string is too long/i
    );
    expect(errorMessage).to.exist;
  });

  it('renders the view options in order: shell, list, json', function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    render(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        jsonDoc="{}"
        updateJsonDoc={noop}
        insertView="json"
      />
    );

    const shell = screen.getByTestId('insert-document-dialog-view-shell');
    const list = screen.getByTestId('insert-document-dialog-view-list');
    const json = screen.getByTestId('insert-document-dialog-view-json');

    expect(
      shell.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING
    ).to.be.greaterThan(0);
    expect(
      list.compareDocumentPosition(json) & Node.DOCUMENT_POSITION_FOLLOWING
    ).to.be.greaterThan(0);
  });

  it('disables the visual editor when the editor holds an array', function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    render(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        jsonDoc='[{ "a": 1 }, { "a": 2 }]'
        updateJsonDoc={noop}
        insertView="json"
      />
    );

    const buttonIn = (testId: string) =>
      screen.getByTestId(testId).querySelector('button');
    expect(buttonIn('insert-document-dialog-view-list')).to.have.property(
      'disabled',
      true
    );
    expect(buttonIn('insert-document-dialog-view-shell')).to.have.property(
      'disabled',
      false
    );
  });

  it('accepts valid shell syntax without an error', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let jsonDoc = '{}';
    function updateJsonDoc(value: string | null) {
      jsonDoc = value ?? '{}';
    }
    const { rerender } = render(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        jsonDoc={jsonDoc}
        updateJsonDoc={updateJsonDoc}
        insertView="shell"
      />
    );
    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-json-editor'),
      '{ _id: ObjectId(), createdAt: new Date() }'
    );
    rerender(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        jsonDoc={jsonDoc}
        updateJsonDoc={updateJsonDoc}
        insertView="shell"
      />
    );
    expect(screen.queryByTestId('insert-document-banner')).to.not.exist;
    expect(screen.getByTestId('insert-document-dialog-view-shell')).to.exist;
  });

  it('shows an error for invalid shell syntax', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let jsonDoc = '{}';
    function updateJsonDoc(value: string | null) {
      jsonDoc = value ?? '{}';
    }
    const { rerender } = render(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        jsonDoc={jsonDoc}
        updateJsonDoc={updateJsonDoc}
        insertView="shell"
      />
    );
    expect(screen.queryByTestId('insert-document-banner')).to.not.exist;
    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-json-editor'),
      '{ _id: ObjectId( }'
    );
    rerender(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        jsonDoc={jsonDoc}
        updateJsonDoc={updateJsonDoc}
        insertView="shell"
      />
    );
    expect(await screen.findByTestId('insert-document-banner')).to.exist;
  });
});
