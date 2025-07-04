import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import HadronDocument from 'hadron-document';
import { DocumentListViewItem } from './document-list-view-item';

describe('DocumentListViewItem', function () {
  let doc: HadronDocument;
  let copyToClipboardStub: sinon.SinonStub;
  let openInsertDocumentDialogStub: sinon.SinonStub;

  beforeEach(function () {
    doc = new HadronDocument({
      _id: 1,
      name: 'test',
      url: 'https://mongodb.com',
      nested: { field: 'value' },
    });

    copyToClipboardStub = sinon.stub();
    openInsertDocumentDialogStub = sinon.stub();
  });

  afterEach(function () {
    sinon.restore();
  });

  it('renders the document component', function () {
    render(
      <DocumentListViewItem
        doc={doc}
        docRef={null}
        docIndex={0}
        isEditable={true}
        copyToClipboard={copyToClipboardStub}
        openInsertDocumentDialog={openInsertDocumentDialogStub}
      />
    );

    // Should render without error
    expect(document.querySelector('[data-testid="editable-document"]')).to
      .exist;
  });

  it('renders context menu when right-clicked', function () {
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

    const element = container.firstChild as HTMLElement;

    // Right-click to open context menu
    userEvent.click(element, { button: 2 });

    // Should show context menu with expected items
    expect(screen.getByText('Copy document')).to.exist;
    expect(screen.getByText('Clone document...')).to.exist;
    expect(screen.getByText('Delete document')).to.exist;
  });

  it('renders scroll trigger when docIndex is 0', function () {
    const scrollTriggerRef = React.createRef<HTMLDivElement>();

    render(
      <DocumentListViewItem
        doc={doc}
        docRef={null}
        docIndex={0}
        isEditable={true}
        scrollTriggerRef={scrollTriggerRef}
        copyToClipboard={copyToClipboardStub}
        openInsertDocumentDialog={openInsertDocumentDialogStub}
      />
    );

    expect(scrollTriggerRef.current).to.exist;
  });

  it('does not render scroll trigger when docIndex is not 0', function () {
    const scrollTriggerRef = React.createRef<HTMLDivElement>();

    render(
      <DocumentListViewItem
        doc={doc}
        docRef={null}
        docIndex={1}
        isEditable={true}
        scrollTriggerRef={scrollTriggerRef}
        copyToClipboard={copyToClipboardStub}
        openInsertDocumentDialog={openInsertDocumentDialogStub}
      />
    );

    expect(scrollTriggerRef.current).to.be.null;
  });
});
