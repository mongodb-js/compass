import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import HadronDocument from 'hadron-document';
import { DocumentListViewItem } from './document-list-view-item';

describe('DocumentListViewItem', function () {
  describe('document context menu', function () {
    let doc: HadronDocument;
    let copyToClipboardStub: sinon.SinonStub;
    let openInsertDocumentDialogStub: sinon.SinonStub;
    let collapseStub: sinon.SinonStub;
    let expandStub: sinon.SinonStub;
    let startEditingStub: sinon.SinonStub;
    let markForDeletionStub: sinon.SinonStub;
    let generateObjectStub: sinon.SinonStub;

    beforeEach(function () {
      doc = new HadronDocument({
        _id: 1,
        name: 'test',
        url: 'https://mongodb.com',
        nested: { field: 'value' },
      });

      copyToClipboardStub = sinon.stub();
      openInsertDocumentDialogStub = sinon.stub();

      // Set up document methods as stubs
      collapseStub = sinon.stub(doc, 'collapse');
      expandStub = sinon.stub(doc, 'expand');
      startEditingStub = sinon.stub(doc, 'startEditing');
      markForDeletionStub = sinon.stub(doc, 'markForDeletion');
      generateObjectStub = sinon.stub(doc, 'generateObject').returns({
        _id: 1,
        name: 'test',
        url: 'https://mongodb.com',
        nested: { field: 'value' },
      });
    });

    /**
     * Renders the element and returns a reference to the first child of the container.
     */
    const renderDocumentListViewItem = (doc: HadronDocument): HTMLElement => {
      const { container } = render(
        <DocumentListViewItem
          doc={doc}
          docRef={null}
          docIndex={0}
          isEditable={true}
          copyToClipboard={copyToClipboardStub}
          openInsertDocumentDialog={openInsertDocumentDialogStub}
        />
      );
      return container.firstChild as HTMLElement;
    };

    afterEach(function () {
      sinon.restore();
    });

    it('shows "Expand all fields" when document is collapsed', function () {
      doc.expanded = false;

      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      expect(screen.getByText('Expand all fields')).to.exist;
    });

    it('shows "Collapse all fields" when document is expanded', function () {
      doc.expanded = true;

      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      expect(screen.getByText('Collapse all fields')).to.exist;
    });

    it('expands document when "Expand all fields" is clicked', function () {
      doc.expanded = false;

      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      // Click expand option
      userEvent.click(screen.getByText('Expand all fields'));

      expect(expandStub).to.have.been.calledOnce;
    });

    it('collapses document when "Collapse all fields" is clicked', function () {
      doc.expanded = true;

      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      // Click collapse option
      userEvent.click(screen.getByText('Collapse all fields'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(collapseStub).to.have.been.calledOnce;
    });

    it('shows "Edit document" when document is not in editing mode', function () {
      doc.editing = false;

      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      expect(screen.getByText('Edit document')).to.exist;
    });

    it('does not show "Edit document" when document is in editing mode', function () {
      doc.editing = true;

      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      expect(screen.queryByText('Edit document')).to.not.exist;
    });

    it('starts editing when "Edit document" is clicked', function () {
      doc.editing = false;

      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      // Click edit option
      userEvent.click(screen.getByText('Edit document'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(startEditingStub).to.have.been.calledOnce;
    });

    it('calls copyToClipboard when "Copy document" is clicked', function () {
      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      // Click copy option
      userEvent.click(screen.getByText('Copy document'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(copyToClipboardStub).to.have.been.calledWith(doc);
    });

    it('opens insert dialog with cloned document when "Clone document..." is clicked', async function () {
      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      // Click clone option
      userEvent.click(screen.getByText('Clone document...'), undefined, {
        skipPointerEventsCheck: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(generateObjectStub).to.have.been.calledWith({
        excludeInternalFields: true,
      });

      expect(openInsertDocumentDialogStub).to.have.been.calledWith(
        {
          _id: 1,
          name: 'test',
          url: 'https://mongodb.com',
          nested: { field: 'value' },
        },
        true
      );
    });

    it('marks document for deletion when "Delete document" is clicked', function () {
      const container = renderDocumentListViewItem(doc);

      // Right-click to open context menu
      userEvent.click(container, { button: 2 });

      // Click delete option
      userEvent.click(screen.getByText('Delete document'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(markForDeletionStub).to.have.been.calledOnce;
    });
  });
});
