import React from 'react';
import { mount } from 'enzyme';
import { Element } from 'hadron-document';
import RevertAction from 'components/revert-action';

describe('<RevertAction />', () => {
  describe('#render', () => {
    const element = new Element('name', 'test', false);
    const component = mount(<RevertAction element={element} />);

    before(() => {
      element.edit('testing');
    });

    it('contains a remove icon', () => {
      const wrapper = component.find('.editable-element-actions');
      expect(wrapper).to.contain(<i className="fa fa-rotate-left" aria-hidden />);
    });

    context('when clicking on the icon', () => {
      before(() => {
        const wrapper = component.find('.editable-element-actions');
        wrapper.simulate('click');
      });

      it('flags the element as unchanged', () => {
        expect(element.isModified()).to.equal(false);
      });

      it('reverts the element value', () => {
        expect(element.currentValue).to.equal('test');
      });
    });
  });
});
