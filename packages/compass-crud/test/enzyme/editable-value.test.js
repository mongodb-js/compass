const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const app = require('hadron-app');
const { Element } = require('hadron-document');
const EditableValue = require('../../src/components/editable-value');

chai.use(chaiEnzyme());

describe('<EditableValue />', () => {
  before(() => {
    global.hadronApp = app;
    global.hadronApp.instance = {
      build: {
        version: '3.4.0'
      }
    };
  });

  after(() => {
    global.hadronApp = undefined;
  });

  describe('#render', () => {
    context('when the value is for an _id field', () => {
      let wrapper;

      before(() => {
        const element = new Element('_id', 1, false);
        wrapper = mount(<EditableValue element={element} isFocused={false} />);
      });

      it('auto focuses the input', () => {
        const input = wrapper.instance()._node;
        expect(input).to.equal(document.activeElement);
      });
    });

    context('when the value corresponds with an editable key', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const element = new Element('name', 'test', false, parentElement);
        wrapper = mount(<EditableValue element={element} isFocused={false} />);
      });

      it('does not auto focus the input', () => {
        const input = wrapper.instance()._node;
        expect(input).to.not.equal(document.activeElement);
      });
    });
  });
});
