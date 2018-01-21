const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const sinon = require('sinon');
const HadronDocument = require('hadron-document');
const DocumentListView = require('../../src/components/document-list-view');

chai.use(chaiEnzyme());

describe('<DocumentListView />', () => {
  describe('#render', () => {
    context('when the documents have objects for ids', () => {
      const docs = [{ _id: { name: 'test-1' }}, { _id: { name: 'test-2' }}];
      const hadronDocs = docs.map(doc => new HadronDocument(doc));
      const scrollHandler = sinon.spy();
      const component = mount(
        <DocumentListView
          docs={hadronDocs}
          scrollHandler={scrollHandler}
          isEditable={false}
          documentRemoved={sinon.spy()}
          openInsertDocumentDialog={sinon.spy()}
          closeAllMenus={sinon.spy()} />
      );

      it('renders all the documents', () => {
        const wrapper = component.find('.document');
        expect(wrapper).to.have.length(2);
      });
    });
  });
});
