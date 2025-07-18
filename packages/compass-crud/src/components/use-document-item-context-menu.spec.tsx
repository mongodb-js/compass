import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import HadronDocument from 'hadron-document';
import { useDocumentItemContextMenu } from './use-document-item-context-menu';

// Test component that uses the hook
const TestComponent: React.FC<
  Parameters<typeof useDocumentItemContextMenu>[0]
> = ({ doc, isEditable, copyToClipboard, openInsertDocumentDialog }) => {
  const ref = useDocumentItemContextMenu({
    doc,
    isEditable,
    copyToClipboard,
    openInsertDocumentDialog,
  });

  return (
    <div data-testid="test-container" ref={ref}>
      Test Content
    </div>
  );
};

describe('useDocumentItemContextMenu', function () {
  let doc: HadronDocument;
  let copyToClipboardStub: sinon.SinonStub;
  let openInsertDocumentDialogStub: sinon.SinonStub;
  let collapseStub: sinon.SinonStub;
  let expandStub: sinon.SinonStub;
  let startEditingStub: sinon.SinonStub;
  let finishEditingStub: sinon.SinonStub;
  let markForDeletionStub: sinon.SinonStub;
  let generateObjectStub: sinon.SinonStub;

  beforeEach(function () {
    doc = new HadronDocument({
      _id: 1,
      name: 'test',
      nested: { field: 'value' },
    });

    copyToClipboardStub = sinon.stub();
    openInsertDocumentDialogStub = sinon.stub();

    // Set up document methods as stubs
    collapseStub = sinon.stub(doc, 'collapse');
    expandStub = sinon.stub(doc, 'expand');
    startEditingStub = sinon.stub(doc, 'startEditing');
    finishEditingStub = sinon.stub(doc, 'finishEditing');
    markForDeletionStub = sinon.stub(doc, 'markForDeletion');
    generateObjectStub = sinon.stub(doc, 'generateObject').returns({
      _id: 1,
      name: 'test',
      nested: { field: 'value' },
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('when editable', function () {
    it('shows all menu items when document is editable and not editing', function () {
      doc.expanded = false;
      doc.editing = false;

      render(
        <TestComponent
          doc={doc}
          isEditable={true}
          copyToClipboard={copyToClipboardStub}
          openInsertDocumentDialog={openInsertDocumentDialogStub}
        />
      );

      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Should show all operations
      expect(screen.getByText('Expand all fields')).to.exist;
      expect(screen.getByText('Edit document')).to.exist;
      expect(screen.getByText('Copy document')).to.exist;
      expect(screen.getByText('Clone document...')).to.exist;
      expect(screen.getByText('Delete document')).to.exist;
    });

    it('shows "Stop editing" when document is editing', function () {
      doc.expanded = false;
      doc.editing = true;

      render(
        <TestComponent
          doc={doc}
          isEditable={true}
          copyToClipboard={copyToClipboardStub}
          openInsertDocumentDialog={openInsertDocumentDialogStub}
        />
      );

      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Should show "Stop editing" when editing
      expect(screen.getByText('Cancel editing')).to.exist;
      expect(screen.queryByText('Edit document')).to.not.exist;
      // But show other operations
      expect(screen.getByText('Expand all fields')).to.exist;
      expect(screen.getByText('Copy document')).to.exist;
      expect(screen.getByText('Clone document...')).to.exist;
      expect(screen.getByText('Delete document')).to.exist;
    });
  });

  describe('when read-only', function () {
    it('shows only non-mutating operations when not editable', function () {
      doc.expanded = false;
      doc.editing = false;

      render(
        <TestComponent
          doc={doc}
          isEditable={false}
          copyToClipboard={copyToClipboardStub}
          openInsertDocumentDialog={openInsertDocumentDialogStub}
        />
      );

      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Should show non-mutating operations
      expect(screen.getByText('Expand all fields')).to.exist;
      expect(screen.getByText('Copy document')).to.exist;

      // Should hide mutating operations
      expect(screen.queryByText('Edit document')).to.not.exist;
      expect(screen.queryByText('Clone document...')).to.not.exist;
      expect(screen.queryByText('Delete document')).to.not.exist;
    });

    it('collapses document when collapse is clicked', function () {
      doc.expanded = true;

      // Render with expanded document
      render(
        <TestComponent
          doc={doc}
          isEditable={true}
          copyToClipboard={copyToClipboardStub}
          openInsertDocumentDialog={openInsertDocumentDialogStub}
        />
      );

      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Click collapse
      userEvent.click(screen.getByText('Collapse all fields'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(collapseStub).to.have.been.calledOnce;
    });
  });

  describe('edit document functionality', function () {
    it('starts editing when "Edit document" is clicked', function () {
      doc.editing = false;
      render(
        <TestComponent
          doc={doc}
          isEditable={true}
          copyToClipboard={copyToClipboardStub}
          openInsertDocumentDialog={openInsertDocumentDialogStub}
        />
      );

      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Should show "Edit document" when not editing
      expect(screen.getByText('Edit document')).to.exist;
      expect(screen.queryByText('Cancel editing')).to.not.exist;

      // Click edit
      userEvent.click(screen.getByText('Edit document'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(startEditingStub).to.have.been.calledOnce;
    });

    it('stops editing when "Stop editing" is clicked', function () {
      doc.editing = true;
      render(
        <TestComponent
          doc={doc}
          isEditable={true}
          copyToClipboard={copyToClipboardStub}
          openInsertDocumentDialog={openInsertDocumentDialogStub}
        />
      );

      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Should show "Stop editing" when editing
      expect(screen.getByText('Cancel editing')).to.exist;
      expect(screen.queryByText('Edit document')).to.not.exist;

      // Click stop editing
      userEvent.click(screen.getByText('Cancel editing'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(finishEditingStub).to.have.been.calledOnce;
    });
  });

  describe('functionality', function () {
    beforeEach(function () {
      render(
        <TestComponent
          doc={doc}
          isEditable={true}
          copyToClipboard={copyToClipboardStub}
          openInsertDocumentDialog={openInsertDocumentDialogStub}
        />
      );
    });

    it('toggles expand/collapse correctly', function () {
      doc.expanded = false;

      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Click expand
      userEvent.click(screen.getByText('Expand all fields'));

      expect(expandStub).to.have.been.calledOnce;
    });

    it('calls copyToClipboard when copy is clicked', function () {
      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Click copy
      userEvent.click(screen.getByText('Copy document'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(copyToClipboardStub).to.have.been.calledWith(doc);
    });

    it('calls openInsertDocumentDialog with cloned document when clone is clicked', function () {
      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Click clone
      userEvent.click(screen.getByText('Clone document...'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(generateObjectStub).to.have.been.calledWith({
        excludeInternalFields: true,
      });
      expect(openInsertDocumentDialogStub).to.have.been.calledWith(
        {
          _id: 1,
          name: 'test',
          nested: { field: 'value' },
        },
        true
      );
    });

    it('marks document for deletion when delete is clicked', function () {
      // Right-click to open context menu
      userEvent.click(screen.getByTestId('test-container'), { button: 2 });

      // Click delete
      userEvent.click(screen.getByText('Delete document'), undefined, {
        skipPointerEventsCheck: true,
      });

      expect(markForDeletionStub).to.have.been.calledOnce;
    });
  });
});
