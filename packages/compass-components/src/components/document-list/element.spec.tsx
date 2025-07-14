import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import HadronDocument from 'hadron-document';
import { HadronElement, getNestedKeyPathForElement } from './element';
import type { Element } from 'hadron-document';

describe('HadronElement', function () {
  describe('context menu', function () {
    let doc: HadronDocument;
    let element: Element;
    let windowOpenStub: sinon.SinonStub;
    let clipboardWriteTextStub: sinon.SinonStub;

    beforeEach(function () {
      doc = new HadronDocument({ field: 'value' });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      element = doc.elements.at(0)!;
      windowOpenStub = sinon.stub(window, 'open');
      clipboardWriteTextStub = sinon.stub(navigator.clipboard, 'writeText');
    });

    afterEach(function () {
      windowOpenStub.restore();
      clipboardWriteTextStub.restore();
    });

    it('can add to query and then remove from query', function () {
      const nestedDoc = new HadronDocument({ user: { name: 'John' } });
      const nestedElement = nestedDoc.get('user')!.get('name')!;

      // Mock onUpdateQuery callback
      const mockonUpdateQuery = sinon.spy();

      // Start with empty query
      const { rerender } = render(
        <HadronElement
          value={nestedElement}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
          onUpdateQuery={mockonUpdateQuery}
          query={{}}
        />
      );

      // Open context menu - should show "Add to query"
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });

      expect(screen.getByText('Add to query')).to.exist;
      expect(screen.queryByText('Remove from query')).to.not.exist;

      userEvent.click(screen.getByText('Add to query'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(mockonUpdateQuery).to.have.been.calledWith(
        'user.name',
        nestedElement.generateObject()
      );

      // Now simulate that the field is in query
      const queryWithField = {
        'user.name': nestedElement.generateObject(),
      };

      // Re-render with updated query state
      rerender(
        <HadronElement
          value={nestedElement}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
          onUpdateQuery={mockonUpdateQuery}
          query={queryWithField}
        />
      );

      // Open context menu again - should now show "Remove from query"
      userEvent.click(elementNode, { button: 2 });

      expect(screen.getByText('Remove from query')).to.exist;
      expect(screen.queryByText('Add to query')).to.not.exist;

      userEvent.click(screen.getByText('Remove from query'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(mockonUpdateQuery).to.have.been.calledTwice;
      expect(mockonUpdateQuery.secondCall).to.have.been.calledWith(
        'user.name',
        nestedElement.generateObject()
      );
    });

    it('copies field and value when "Copy field & value" is clicked', function () {
      render(
        <HadronElement
          value={element}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
        />
      );

      // Open context menu and click the copy option
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });
      userEvent.click(screen.getByText('Copy field & value'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(clipboardWriteTextStub).to.have.been.calledWith('field: "value"');
    });

    it('shows "Open URL in browser" for URL string values', function () {
      const urlDoc = new HadronDocument({ link: 'https://mongodb.com' });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const urlElement = urlDoc.elements.at(0)!;

      render(
        <HadronElement
          value={urlElement}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
        />
      );

      // Open context menu
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });

      // Check if the menu item exists
      expect(screen.getByText('Open URL in browser')).to.exist;
    });

    it('opens URL in new tab when "Open URL in browser" is clicked', function () {
      const urlDoc = new HadronDocument({ link: 'https://mongodb.com' });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const urlElement = urlDoc.elements.at(0)!;

      render(
        <HadronElement
          value={urlElement}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
        />
      );

      // Open context menu and click the open URL option
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });
      userEvent.click(screen.getByText('Open URL in browser'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(windowOpenStub).to.have.been.calledWith(
        'https://mongodb.com',
        '_blank',
        'noopener'
      );
    });

    it('does not show "Open URL in browser" for non-URL string values', function () {
      render(
        <HadronElement
          value={element}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
        />
      );

      // Open context menu
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });

      // Check that the menu item doesn't exist
      expect(screen.queryByText('Open URL in browser')).to.not.exist;
    });

    it('does not show "Add to query" when onUpdateQuery is not provided', function () {
      render(
        <HadronElement
          value={element}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
        />
      );
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });

      expect(screen.queryByText('Add to query')).to.not.exist;
    });

    it('calls the correct parameters when "Add to query" is clicked', function () {
      const nestedDoc = new HadronDocument({ user: { name: 'John' } });
      const nestedElement = nestedDoc.get('user')!.get('name')!;
      const mockonUpdateQuery = sinon.spy();

      render(
        <HadronElement
          value={nestedElement}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
          onUpdateQuery={mockonUpdateQuery}
          query={{}}
        />
      );

      // Open context menu and click the add to query option
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });
      userEvent.click(screen.getByText('Add to query'), undefined, {
        skipPointerEventsCheck: true,
      });

      // Verify that toggleQueryFilter was called with the nested field path and element's generated object
      expect(mockonUpdateQuery).to.have.been.calledWith(
        'user.name',
        nestedElement.generateObject()
      );
    });
  });

  describe('getNestedKeyPathForElement', function () {
    it('returns the field name for a top-level field', function () {
      const doc = new HadronDocument({ field: 'value' });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const element = doc.elements.at(0)!;

      const result = getNestedKeyPathForElement(element);

      expect(result).to.equal('field');
    });

    it('returns dot notation path for nested object fields', function () {
      const doc = new HadronDocument({
        user: {
          profile: {
            name: 'John',
          },
        },
      });
      const nameElement = doc.get('user')!.get('profile')!.get('name')!;

      const result = getNestedKeyPathForElement(nameElement);

      expect(result).to.equal('user.profile.name');
    });

    it('skips array indices in the path', function () {
      const doc = new HadronDocument({
        items: [{ name: 'item1' }, { name: 'item2' }],
      });
      const nameElement = doc.get('items')!.elements!.at(0)!.get('name')!;

      const result = getNestedKeyPathForElement(nameElement);

      expect(result).to.equal('items.name');
    });

    it('handles mixed nesting with arrays and objects', function () {
      const doc = new HadronDocument({
        orders: [
          {
            items: [{ product: { name: 'Widget' } }],
          },
        ],
      });
      const nameElement = doc
        .get('orders')!
        .elements!.at(0)!
        .get('items')!
        .elements!.at(0)!
        .get('product')!
        .get('name')!;

      const result = getNestedKeyPathForElement(nameElement);

      expect(result).to.equal('orders.items.product.name');
    });

    it('handles array elements at the top level', function () {
      const doc = new HadronDocument({
        items: [{ name: 'item1' }, { name: 'item2' }],
      });
      const nameElement = doc.elements.get('items')!.at(0)!.get('name')!;

      const result = getNestedKeyPathForElement(nameElement);

      expect(result).to.equal('items.name');
    });

    it('handles deeply nested objects', function () {
      const doc = new HadronDocument({
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
              },
            },
          },
        },
      });
      const valueElement = doc
        .get('level1')!
        .get('level2')!
        .get('level3')!
        .get('level4')!
        .get('value')!;

      const result = getNestedKeyPathForElement(valueElement);

      expect(result).to.equal('level1.level2.level3.level4.value');
    });

    it('handles field names with special characters', function () {
      const doc = new HadronDocument({
        'field-with-dashes': {
          field_with_underscores: {
            'field.with.dots': 'value',
          },
        },
      });
      const dotsElement = doc
        .get('field-with-dashes')!
        .get('field_with_underscores')!
        .get('field.with.dots')!;

      const result = getNestedKeyPathForElement(dotsElement);

      expect(result).to.equal(
        'field-with-dashes.field_with_underscores.field.with.dots'
      );
    });

    it('handles numeric field names', function () {
      const doc = new HadronDocument({
        123: {
          456: 'value',
        },
      });
      const numericElement = doc.get('123')!.get('456')!;

      const result = getNestedKeyPathForElement(numericElement);

      expect(numericElement.value).to.equal('value');
      expect(result).to.equal('123.456');
    });

    it('handles empty object elements', function () {
      const doc = new HadronDocument({ emptyObj: {} });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const emptyObjElement = doc.elements.at(0)!;

      const result = getNestedKeyPathForElement(emptyObjElement);

      expect(result).to.equal('emptyObj');
    });
  });
});
