const React = require('react');
const Reflux = require('reflux');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');
const { mount } = require('enzyme');
const sinon = require('sinon');
const EditableDocument = require('../../src/components/editable-document');
const EditableElement = require('../../src/components/editable-element');
const EditableValue = require('../../src/components/editable-value');

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
      wrapper = mount(<EditableDocument doc={doc} closeAllMenus={sinon.spy(Reflux.createAction())} />);
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

    context('COMPASS-1732 when the value is an array', () => {
      // .focus() costs ~30ms to call, so instead of focusing every array
      // element, jump straight to the last array element
      const _focus = window.HTMLElement.prototype.focus;
      let spy;
      let _instance;
      let secondLastInput;
      let lastInput;
      before(() => {
        spy = sinon.spy(_focus);
        window.HTMLElement.prototype.focus = spy;
        const arrayDoc = {
          long_array: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
        };
        wrapper = mount(<EditableDocument doc={arrayDoc} closeAllMenus={sinon.spy(Reflux.createAction())} />);

        // Set build version, so setState does not throw an error
        _instance = global.hadronApp.instance;
        global.hadronApp.instance = {build: {version: '3.4.7'}};
        wrapper.setState({
          editing: true,
          expandAll: true
        });
        const editables = wrapper.find(EditableElement);
        const secondLastElement = editables.slice(-2, -1);
        const lastElement = editables.slice(-1);
        secondLastInput = secondLastElement.find(EditableValue).find('input');
        lastInput = lastElement.find(EditableValue).find('input');
      });

      after(() => {
        // Restore global variables so they shouldn't leak into other tests
        global.hadronApp.instance = _instance;
        window.HTMLElement.prototype.focus = _focus;
      });

      it('it never focuses inputs such as the second last', () => {
        expect(secondLastInput.matchesElement(document.activeElement)).to.equal(false);
        expect(spy.callCount).to.be.equal(1);
      });

      it('auto focuses the last input', () => {
        expect(lastInput.matchesElement(document.activeElement)).to.equal(true);
        expect(spy.callCount).to.be.equal(1);
      });
    });
  });
});
