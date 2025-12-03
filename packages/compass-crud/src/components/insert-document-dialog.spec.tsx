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
  toggleInsertDocument: noop,
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
        jsonView
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
        jsonView
      />
    );
    const errorMessage = await screen.findByText(
      /numberLong string is too long/i
    );
    expect(errorMessage).to.exist;
  });
});
