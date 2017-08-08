const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const Document = require('hadron-document');
const Element = Document.Element;
const EditableKey = require('../../src/components/editable-key');

chai.use(chaiEnzyme());

describe('<EditableKey />', () => {
  describe('#render', () => {
    context('when the key is for an added element', () => {
      context('when the key is an array element', () => {
        let wrapper;

        before(() => {
          const parentElement = new Element('parent', [], true);
          const element = new Element('0', 1, true, parentElement);
          wrapper = mount(<EditableKey element={element} isFocused={false} />);
        });

        it('does not auto focus the input', () => {
          const input = wrapper.instance()._node;
          expect(input).to.not.equal(document.activeElement);
        });
      });

      context('when the key corresponds with an editable key', () => {
        let wrapper;

        before(() => {
          const parentElement = new Element('parent', {}, true);
          const element = new Element('name', 'test', false, parentElement);
          wrapper = mount(<EditableKey element={element} isFocused={false} />);
        });

        it('auto focuses the input', () => {
          const input = wrapper.instance()._node;
          expect(input).to.equal(document.activeElement);
        });
      });
    });

    context('when the key is not for an added element', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const element = new Element('name', 'test', false, parentElement);
        wrapper = mount(<EditableKey element={element} isFocused={false} />);
      });

      it('does not auto focus the input', () => {
        const input = wrapper.instance()._node;
        expect(input).to.not.equal(document.activeElement);
      });
    });
  });
});
