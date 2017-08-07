const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');
const { mount } = require('enzyme');
const EditableDocument = require('../../src/components/editable-document');

chai.use(chaiEnzyme());

describe('<EditableDocument />', () => {
  before(() => {
    global.hadronApp = app;
    global.hadronApp.appRegistry = new AppRegistry();
  });

  after(() => {
    global.hadronApp.appRegistry = new AppRegistry();
  });

  describe('#render', () => {
    let wrapper;
    const doc = { a: 1, b: 2 };

    before(() => {
      wrapper = mount(<EditableDocument doc={doc} />);
    });

    it('renders the list div', () => {
      const component = wrapper.find('.document');
      expect(component).to.be.present();
    });

    it('renders the base element list', () => {
      const component = wrapper.find('.document-elements');
      expect(component).to.be.present();
    });

    it('renders an editable element for each document element', () => {
      const component = wrapper.find('.document-elements');
      expect(component.children().length).to.equal(2);
    });
  });
});
