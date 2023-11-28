import React from 'react';
import { mount } from 'enzyme';
import HadronDocument from 'hadron-document';
import { expect } from 'chai';
import sinon from 'sinon';

import DocumentListView from './document-list-view';

describe('<DocumentListView />', function () {
  describe('#render', function () {
    context('when the documents have objects for ids', function () {
      const docs = [{ _id: { name: 'test-1' } }, { _id: { name: 'test-2' } }];
      const hadronDocs = docs.map((doc) => new HadronDocument(doc));
      const component = mount(
        <DocumentListView
          docs={hadronDocs}
          isEditable={false}
          isTimeSeries={false}
          copyToClipboard={sinon.spy()}
          removeDocument={sinon.spy()}
          replaceDocument={sinon.spy()}
          updateDocument={sinon.spy()}
          openInsertDocumentDialog={sinon.spy()}
        />
      );

      it('renders all the documents', function () {
        const wrapper = component.find('[data-testid="readonly-document"]');
        expect(wrapper).to.have.length(2);
      });
    });
  });
});
