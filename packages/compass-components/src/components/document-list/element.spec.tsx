import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import HadronDocument from 'hadron-document';
import { HadronElement } from './element';
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

    it('copies field and value when "Copy field & value" is clicked', function () {
      render(
        <HadronElement
          value={element}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
          onAddToQuery={() => {}}
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
          onAddToQuery={() => {}}
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
          onAddToQuery={() => {}}
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
          onAddToQuery={() => {}}
        />
      );

      // Open context menu
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });

      // Check that the menu item doesn't exist
      expect(screen.queryByText('Open URL in browser')).to.not.exist;
    });

    it('calls the correct parameters when "Add to query" is clicked', function () {
      const onAddToQuerySpy = sinon.spy();

      render(
        <HadronElement
          value={element}
          editable={true}
          editingEnabled={true}
          lineNumberSize={1}
          onAddElement={() => {}}
          onAddToQuery={onAddToQuerySpy}
        />
      );

      // Open context menu and click the add to query option
      const elementNode = screen.getByTestId('hadron-document-element');
      userEvent.click(elementNode, { button: 2 });
      userEvent.click(screen.getByText('Add to query'), undefined, {
        skipPointerEventsCheck: true,
      });

      // Verify that onAddToQuery was called with the field name and element's generated object
      expect(onAddToQuerySpy).to.have.been.calledWith(
        'field',
        element.generateObject()
      );
    });
  });
});
