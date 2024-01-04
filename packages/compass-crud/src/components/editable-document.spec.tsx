import React from 'react';
import Reflux from 'reflux';
import { mount } from 'enzyme';
import HadronDocument from 'hadron-document';
import { expect } from 'chai';
import sinon from 'sinon';

import EditableDocument from './editable-document';

describe('<EditableDocument />', function () {
  describe('#render', function () {
    let wrapper;
    const doc = { a: 1, b: 2, c: null };
    const action = Reflux.createAction();

    before(function () {
      wrapper = mount(
        <EditableDocument
          doc={new HadronDocument(doc)}
          removeDocument={sinon.spy(action)}
          replaceDocument={sinon.spy(action)}
          updateDocument={sinon.spy(action)}
          copyToClipboard={sinon.spy(action)}
          openInsertDocumentDialog={sinon.spy(action)}
        />
      );
    });

    it('renders the list div', function () {
      const component = wrapper.find('[data-testid="editable-document"]');
      (expect(component) as any).to.be.present();
    });

    it('renders the base element list', function () {
      const component = wrapper.find(
        '[data-testid="editable-document-elements"]'
      );
      (expect(component) as any).to.be.present();
    });

    it('renders an editable element for each document element', function () {
      const component = wrapper.find('[data-testid="hadron-document-element"]');
      expect(component).to.have.lengthOf(3);
    });
  });
});
