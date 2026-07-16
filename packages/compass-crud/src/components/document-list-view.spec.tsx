import React from 'react';
import { render, screen, cleanup } from '@mongodb-js/testing-library-compass';
import HadronDocument from 'hadron-document';
import { expect } from 'chai';

import DocumentListView from './document-list-view';

describe('<DocumentListView />', function () {
  afterEach(cleanup);

  describe('#render', function () {
    context('when the documents have objects for ids', function () {
      it('renders all the documents', function () {
        const docs = [{ _id: { name: 'test-1' } }, { _id: { name: 'test-2' } }];
        const hadronDocs = docs.map((doc) => new HadronDocument(doc));

        render(
          <DocumentListView
            docs={hadronDocs}
            isEditable={false}
            isTimeSeries={false}
          />
        );

        const documents = screen.getAllByTestId('readonly-document');
        expect(documents).to.have.length(2);
      });
    });

    context('when a readonly document has no fields', function () {
      it('renders the document as an empty object', function () {
        const hadronDocs = [
          new HadronDocument({ _id: 1 }),
          new HadronDocument({}),
        ];

        render(
          <DocumentListView
            docs={hadronDocs}
            isEditable={false}
            isTimeSeries={false}
          />
        );

        const emptyDocs = screen.getAllByTestId('readonly-document-empty');
        expect(emptyDocs).to.have.length(1);
        expect(emptyDocs[0].textContent).to.equal('{}');
      });
    });
  });
});
