import React, { useState } from 'react';
import { expect } from 'chai';
import {
  render,
  cleanup,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HadronDocument from 'hadron-document';
import Document from './document';

const EditableDoc = ({ doc }) => {
  const [editing, setEditing] = useState(false);

  return (
    <Document
      value={doc}
      editable
      editing={editing}
      onEditStart={() => {
        setEditing(true);
      }}
    ></Document>
  );
};

describe('Document', function () {
  let doc: HadronDocument;
  beforeEach(function () {
    doc = new HadronDocument({
      str: 'abc',
      num: 123,
      date: new Date(0),
      null_value: null,
      // Regression test for very large numbers of parameters passed to
      // Math.max(). One test starts to fail at around 62535 line breaks, more
      // after that. It depends on how much data is already on the stack at that
      // point.
      crazy_string: Array.from({ length: 100000 }, () => '\n').join('\n'),
    });
  });

  afterEach(cleanup);

  it('should render HadronDocument keys and values', function () {
    render(<Document value={doc}></Document>);
    expect(screen.getByText('str')).to.exist;
    expect(screen.getByTitle('abc')).to.exist;

    expect(screen.getByText('num')).to.exist;
    expect(screen.getByTitle('123')).to.exist;

    expect(screen.getByText('date')).to.exist;
    expect(screen.getByTitle('1970-01-01T00:00:00.000+00:00')).to.exist;
  });

  describe('edit mode', function () {
    it('should change element key name on edit', function () {
      render(<Document value={doc} editable editing></Document>);

      const el = document.querySelector<HTMLElement>(
        `[data-id="${doc.get('str').uuid}"]`
      );
      const keyEditor = within(el).getByTestId('hadron-document-key-editor');

      userEvent.clear(keyEditor);
      userEvent.keyboard('new_name');
      userEvent.tab();

      expect(screen.getByDisplayValue('new_name')).to.exist;

      expect(doc.get('new_name').key).to.eq('str');
      expect(doc.get('new_name').currentKey).to.eq('new_name');
    });

    it('should change element string value on edit', function () {
      render(<Document value={doc} editable editing></Document>);

      const el = document.querySelector<HTMLElement>(
        `[data-id="${doc.get('str').uuid}"]`
      );

      const valueEditor = within(el).getByTestId(
        'hadron-document-value-editor'
      );

      userEvent.clear(valueEditor);
      userEvent.keyboard('bla');
      userEvent.tab();

      expect(doc.get('str').currentValue).to.eq('bla');
      expect(doc.get('str').currentType).to.eq('String');
    });

    it('should change element number value on edit', function () {
      render(<Document value={doc} editable editing></Document>);

      const el = document.querySelector<HTMLElement>(
        `[data-id="${doc.get('num').uuid}"]`
      );

      const valueEditor = within(el).getByTestId(
        'hadron-document-value-editor'
      );

      userEvent.clear(valueEditor);
      userEvent.keyboard('321');
      userEvent.tab();

      expect(doc.get('num').currentValue.valueOf()).to.eq(321);
      expect(doc.get('num').currentType).to.eq('Int32');
    });

    it('should change element date value on edit', function () {
      render(<Document value={doc} editable editing></Document>);

      const el = document.querySelector<HTMLElement>(
        `[data-id="${doc.get('date').uuid}"]`
      );

      const valueEditor = within(el).getByTestId(
        'hadron-document-value-editor'
      );

      userEvent.clear(valueEditor);
      userEvent.keyboard('2000-01-01');
      userEvent.tab();

      expect((doc.get('date').currentValue as Date).toISOString()).to.eq(
        '2000-01-01T00:00:00.000Z'
      );
      expect(doc.get('date').currentType).to.eq('Date');
    });

    it('should change element type on edit', function () {
      render(<Document value={doc} editable editing></Document>);

      const el = document.querySelector<HTMLElement>(
        `[data-id="${doc.get('num').uuid}"]`
      );

      const typeEditor = within(el).getByTestId('hadron-document-type-editor');

      userEvent.selectOptions(typeEditor, 'String');
      userEvent.tab();

      expect(doc.get('num').currentValue.valueOf()).to.eq('123');
      expect(doc.get('num').currentType).to.eq('String');
    });
  });

  it('should render decrypted fields specially', function () {
    const obj = {
      _id: 0,
      key1: 'a',
      key2: 'b',
      key3: 'c',
      [Symbol.for('@@mdb.decryptedKeys')]: ['key1', 'key2'],
    };
    doc = new HadronDocument(obj);
    render(<Document value={doc}></Document>);
    expect(screen.getAllByTitle('Encrypted Field')).to.have.lengthOf(2);
  });

  it('should allow editing the null value (COMPASS-5697)', function () {
    render(<Document value={doc} editable editing></Document>);

    const el = document.querySelector<HTMLElement>(
      `[data-id="${doc.get('null_value').uuid}"]`
    );

    const typeEditor = within(el).getByTestId('hadron-document-type-editor');

    userEvent.selectOptions(typeEditor, 'String');
    userEvent.tab();

    const valueEditor = within(el).getByTestId('hadron-document-value-editor');

    userEvent.clear(valueEditor);
    userEvent.keyboard('foo bar');
    userEvent.tab();

    expect(doc.get('null_value').currentValue.valueOf()).to.eq('foo bar');
    expect(doc.get('null_value').currentType).to.eq('String');
  });

  it('should autofocus key editor when double-clicking key', function () {
    render(<EditableDoc doc={doc}></EditableDoc>);

    const el = document.querySelector<HTMLElement>(
      `[data-id="${doc.get('str').uuid}"]`
    );

    userEvent.dblClick(within(el).getByTestId('hadron-document-clickable-key'));

    const editor = within(el).getByTestId('hadron-document-key-editor');

    expect(editor).to.eq(document.activeElement);
  });

  it('should autofocus value editor when double-clicking value', function () {
    render(<EditableDoc doc={doc}></EditableDoc>);

    const el = document.querySelector<HTMLElement>(
      `[data-id="${doc.get('str').uuid}"]`
    );

    userEvent.dblClick(
      within(el).getByTestId('hadron-document-clickable-value')
    );

    const editor = within(el).getByTestId('hadron-document-value-editor');

    expect(editor).to.eq(document.activeElement);
  });

  it('should autofocus type editor when double-clicking a non-editable value', function () {
    render(<EditableDoc doc={doc}></EditableDoc>);

    const el = document.querySelector<HTMLElement>(
      `[data-id="${doc.get('null_value').uuid}"]`
    );

    userEvent.dblClick(
      within(el).getByTestId('hadron-document-clickable-value')
    );

    const editor = within(el).getByTestId('hadron-document-type-editor');

    expect(editor).to.eq(document.activeElement);
  });

  it('should render doc in expanded/collapsed mode when the entire doc is expanded/collapsed', function () {
    const hadronDoc = new HadronDocument({
      names: {
        firstName: 'A',
        lastName: 'B',
      },
    });
    hadronDoc.expand();
    render(<Document value={hadronDoc}></Document>);

    expect(screen.getByText('names')).to.exist;
    expect(screen.getByText('firstName')).to.exist;
    expect(screen.getByText('lastName')).to.exist;

    hadronDoc.collapse();
    expect(() => screen.getByText('firstName')).to.throw;
    expect(() => screen.getByText('lastName')).to.throw;
  });

  it('should render "Show more" toggle when number of fields are more than allowed visible fields', async function () {
    const hadronDoc = new HadronDocument({
      prop1: 'prop1',
      prop2: 'prop2',
      prop3: 'prop3',
      prop4: 'prop4',
    });
    hadronDoc.setVisibleElementsCount(2);
    render(<Document value={hadronDoc}></Document>);
    expect(screen.getByText('prop1')).to.exist;
    expect(screen.getByText('prop2')).to.exist;
    expect(() => screen.getByText('prop3')).to.throw;
    expect(() => screen.getByText('prop4')).to.throw;
    expect(screen.getByText('Show 2 more fields')).to.exist;

    hadronDoc.setVisibleElementsCount(25);
    await waitFor(() => {
      expect(screen.getByText('prop3')).to.exist;
      expect(screen.getByText('prop4')).to.exist;
    });
  });

  it('should render "Show more" toggle on element when its nested fields are more than allowed visible fields', async function () {
    const hadronDoc = new HadronDocument({
      nested: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: 'prop3',
        prop4: 'prop4',
      },
    });
    const [nestedElement] = [...hadronDoc.elements];
    hadronDoc.expand();
    render(<Document value={hadronDoc}></Document>);
    expect(screen.getByText('nested')).to.exist;
    expect(screen.getByText('prop1')).to.exist;
    expect(screen.getByText('prop2')).to.exist;
    expect(screen.getByText('prop3')).to.exist;
    expect(screen.getByText('prop4')).to.exist;

    nestedElement.setVisibleElementsCount(2);
    await waitFor(() => {
      expect(() => screen.getByText('prop3')).to.throw;
      expect(() => screen.getByText('prop4')).to.throw;
    });
  });
});
