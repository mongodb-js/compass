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
  });
});
