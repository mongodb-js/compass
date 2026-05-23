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
    it('opens the edit modal instead of entering an inline edit state', function () {
      const doc = new HadronDocument({ a: 1 });
      const openUpdateDocumentModal = sinon.spy();
      const startEditing = sinon.spy(doc, 'startEditing');
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

      userEvent.click(screen.getByTestId('edit-document-button'));

      expect(openUpdateDocumentModal).to.have.been.calledOnceWith(doc);
      // The row does not enter an inline editing state
      expect(startEditing).to.not.have.been.called;
      expect(screen.queryByTestId('document-footer')).to.not.exist;
    });
  });
});
