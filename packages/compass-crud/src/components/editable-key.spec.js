import React from 'react';
import { mount } from 'enzyme';
import { Element } from 'hadron-document';
import EditableKey from './editable-key';

describe('<EditableKey />', () => {
  describe('#render', () => {
    context('when the key exists', () => {
      let wrapper;

      before(() => {
        const parentElement = new Element('parent', {}, false);
        const element = new Element('key', 1, true, parentElement);
        wrapper = mount(<EditableKey element={element} isFocused={false} />);
      });

      it('has a width corresponding to the key string length', () => {
        expect(wrapper.find('input').prop('style').width).to.equal('3.5ch');
      });
    });

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
          wrapper = mount(<EditableKey element={element} isFocused={false} />, {
            attachTo: document.body,
          });
        });

        after(() => {
          if (wrapper && wrapper.unmount) {
            wrapper.unmount();
          }
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
