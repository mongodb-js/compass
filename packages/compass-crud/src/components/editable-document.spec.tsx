import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import HadronDocument from 'hadron-document';
import { expect } from 'chai';
import sinon from 'sinon';

import EditableDocument from './editable-document';

describe('<EditableDocument />', function () {
  describe('render', function () {
    const doc = { a: 1, b: 2, c: null };

    beforeEach(function () {
      render(
        <EditableDocument
          doc={new HadronDocument(doc)}
          removeDocument={sinon.spy()}
          replaceDocument={sinon.spy()}
          updateDocument={sinon.spy()}
          copyToClipboard={sinon.spy()}
          openInsertDocumentDialog={sinon.spy()}
        />
      );
    });

    it('renders the list div', function () {
      const component = screen.getByTestId('editable-document');
      expect(component).to.exist;
    });

    it('renders the base element list', function () {
      const component = screen.getByTestId('editable-document-elements');
      expect(component).to.exist;
    });

    it('renders an editable element for each document element', function () {
      const components = screen.getAllByTestId('hadron-document-element');
      expect(components).to.have.lengthOf(3);
    });
  });

  describe('edit routing', function () {
    function renderRow(
      doc: HadronDocument,
      openUpdateDocumentModal = sinon.spy()
    ) {
      render(
        <EditableDocument
          doc={doc}
          removeDocument={sinon.spy()}
          replaceDocument={sinon.spy()}
          updateDocument={sinon.spy()}
          copyToClipboard={sinon.spy()}
          openInsertDocumentDialog={sinon.spy()}
          openUpdateDocumentModal={openUpdateDocumentModal}
        />
      );
      return { openUpdateDocumentModal };
    }

    it('pencil button enters the inline edit state without opening the modal', function () {
      const doc = new HadronDocument({ a: 1 });
      const startEditing = sinon.spy(doc, 'startEditing');
      const { openUpdateDocumentModal } = renderRow(doc);

      userEvent.click(screen.getByTestId('edit-document-button'));

      expect(startEditing).to.have.been.calledOnce;
      expect(openUpdateDocumentModal).to.not.have.been.called;
    });

    it('wrench button opens the update modal without entering inline edit', function () {
      const doc = new HadronDocument({ a: 1 });
      const startEditing = sinon.spy(doc, 'startEditing');
      const { openUpdateDocumentModal } = renderRow(doc);

      userEvent.click(screen.getByTestId('open-update-document-modal-button'));

      expect(openUpdateDocumentModal).to.have.been.calledOnceWith(doc);
      expect(startEditing).to.not.have.been.called;
    });

    it('row stays in read-only display even though the modal action starts an editing session on the same doc', function () {
      const doc = new HadronDocument({ a: 1 });
      // Simulate what the real crud-store openUpdateDocumentModal does: it
      // calls doc.startEditing() under the hood, which fires EditingStarted
      // on the row's listener. The row should ignore that one event so it
      // doesn't render the inline-edit footer behind the modal.
      const openUpdateDocumentModal = sinon.spy((d: HadronDocument) => {
        d.startEditing();
      });
      renderRow(doc, openUpdateDocumentModal);

      userEvent.click(screen.getByTestId('open-update-document-modal-button'));

      expect(openUpdateDocumentModal).to.have.been.calledOnceWith(doc);
      expect(screen.queryByTestId('document-footer')).to.not.exist;
    });
  });
});
