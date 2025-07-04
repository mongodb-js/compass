import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
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
});
