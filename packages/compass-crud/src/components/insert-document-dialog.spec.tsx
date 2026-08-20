import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
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
    let editorText = '{}';
    const doc = new HadronDocument({});
    doc.editing = true;
    function updateInsertDocText(value: string | null) {
      doc.setModifiedEJSONString(value);
      editorText = value ?? '{}';
    }
    const { rerender } = render(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="json"
      />
    );
    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      '{ "invalid_long": { "$numberLong": "1234567234324812317654321" } } '
    );
    rerender(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
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
        editorText="{}"
        updateInsertDocText={noop}
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
        editorText='[{ "a": 1 }, { "a": 2 }]'
        updateInsertDocText={noop}
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
    let editorText = '{}';
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const { rerender } = render(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="shell"
      />
    );
    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      '{ _id: ObjectId(), createdAt: new Date() }'
    );
    rerender(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="shell"
      />
    );
    expect(screen.queryByTestId('insert-document-banner')).to.not.exist;
    expect(screen.getByTestId('insert-document-dialog-view-shell')).to.exist;
  });

  it('disables switching views while a number exceeds the safe integer range', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let editorText = '{}';
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const renderDialog = () => (
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="shell"
      />
    );
    const { rerender } = render(renderDialog());
    const buttonIn = (testId: string) =>
      screen.getByTestId(testId).querySelector('button');

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      '{ a: 9007199254740993 }'
    );
    rerender(renderDialog());

    await waitFor(() => {
      expect(buttonIn('insert-document-dialog-view-json')).to.have.property(
        'disabled',
        true
      );
    });
    expect(buttonIn('insert-document-dialog-view-list')).to.have.property(
      'disabled',
      true
    );

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      '{ a: Long("9007199254740993") }'
    );
    rerender(renderDialog());

    await waitFor(() => {
      expect(buttonIn('insert-document-dialog-view-json')).to.have.property(
        'disabled',
        false
      );
    });
  });

  it('converts Extended JSON to shell syntax without losing number types', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let editorText = '{}';
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const renderDialog = () => (
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="shell"
      />
    );
    const { rerender } = render(renderDialog());

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      `{ _id: ObjectId('642d766b7300158b1f22e972'), big: { "$numberLong": "9007199254740993" } }`
    );
    rerender(renderDialog());

    userEvent.click(
      await screen.findByTestId('insert-document-ejson-conversion-button')
    );

    // The Extended JSON becomes shell syntax and the parts that were already
    // shell syntax survive the conversion.
    expect(editorText).to.equal(
      `{
  _id: ObjectId('642d766b7300158b1f22e972'),
  big: NumberLong('9007199254740993')
}`
    );
  });

  it('shows why a conversion failed and clears the error when the text changes', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let editorText = '{}';
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const renderDialog = () => (
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="shell"
      />
    );
    const { rerender } = render(renderDialog());

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      `{ _id: { "$oid": "not-an-object-id" } }`
    );
    rerender(renderDialog());

    userEvent.click(
      await screen.findByTestId('insert-document-ejson-conversion-button')
    );
    rerender(renderDialog());

    expect(await screen.findByTestId('insert-document-ejson-conversion-error'))
      .to.exist;
    // The text is left as it was so it can be fixed by hand.
    expect(editorText).to.equal(`{ _id: { "$oid": "not-an-object-id" } }`);

    // The error only applies to the text it was produced for.
    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      `{ _id: { "$oid": "642d766b7300158b1f22e972" } }`
    );
    rerender(renderDialog());

    await waitFor(() => {
      expect(screen.queryByTestId('insert-document-ejson-conversion-error')).to
        .not.exist;
    });
    expect(screen.getByTestId('insert-document-ejson-conversion-banner')).to
      .exist;
  });

  it('does not offer the conversion in the EJSON view', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let editorText = '{}';
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const renderDialog = () => (
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="json"
      />
    );
    const { rerender } = render(renderDialog());

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      `{ "_id": { "$oid": "642d766b7300158b1f22e972" } }`
    );
    rerender(renderDialog());

    expect(screen.queryByTestId('insert-document-ejson-conversion-banner')).to
      .not.exist;
  });

  it('fixes unsafe integers with shell syntax in the shell view', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let editorText = '{}';
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const renderDialog = () => (
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="shell"
      />
    );
    const { rerender } = render(renderDialog());

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      '{ a: 9007199254740993 }'
    );
    rerender(renderDialog());

    userEvent.click(
      await screen.findByTestId('insert-document-error-action-button')
    );

    await waitFor(() => {
      expect(editorText).to.equal('{ a: Long("9007199254740993") }');
    });
  });

  it('fixes unsafe integers with Extended JSON in the EJSON view', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let editorText = '{}';
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const renderDialog = () => (
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="json"
      />
    );
    const { rerender } = render(renderDialog());

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      '{ "a": 9007199254740993 }'
    );
    rerender(renderDialog());

    userEvent.click(
      await screen.findByTestId('insert-document-error-action-button')
    );

    await waitFor(() => {
      expect(editorText).to.equal(
        '{ "a": {"$numberLong": "9007199254740993"} }'
      );
    });
  });

  it('still allows inserting while the Extended JSON banner is shown', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let editorText = '{}';
    let insertCalls = 0;
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const renderDialog = () => (
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertDocument={() => {
          insertCalls++;
        }}
        insertView="shell"
      />
    );
    const { rerender } = render(renderDialog());

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      '{ big: { "$numberLong": "12345" } }'
    );
    rerender(renderDialog());

    expect(await screen.findByTestId('insert-document-ejson-conversion-banner'))
      .to.exist;

    const insertButton = screen.getByRole('button', { name: 'Insert' });
    expect(insertButton).to.not.have.attribute('aria-disabled', 'true');
    expect(insertButton).to.not.have.attribute('disabled');

    expect(insertCalls).to.equal(0);
    userEvent.click(insertButton);
    await waitFor(() => expect(insertCalls).to.equal(1));
  });

  it('shows an error for invalid shell syntax', async function () {
    const doc = new HadronDocument({});
    doc.editing = true;
    let editorText = '{}';
    function updateInsertDocText(value: string | null) {
      editorText = value ?? '{}';
    }
    const { rerender } = render(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="shell"
      />
    );
    expect(screen.queryByTestId('insert-document-banner')).to.not.exist;
    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-editor'),
      '{ _id: ObjectId( }'
    );
    rerender(
      <InsertDocumentDialog
        {...defaultProps}
        doc={doc}
        editorText={editorText}
        updateInsertDocText={updateInsertDocText}
        insertView="shell"
      />
    );
    expect(await screen.findByTestId('insert-document-banner')).to.exist;
  });
});
