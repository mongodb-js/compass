import React from 'react';
import { mount } from 'enzyme';
import { Element } from 'hadron-document';
import RemoveAction from 'components/remove-action';

describe('<RemoveAction />', () => {
  describe('#render', () => {
    const element = new Element('name', 'test', false);
    const component = mount(<RemoveAction element={element} />);

    it('contains a remove icon', () => {
      const wrapper = component.find('.editable-element-actions');
      expect(wrapper).to.contain(<i className="fa fa-times-circle" aria-hidden />);
    });

    context('when clicking on the icon', () => {
      before(() => {
        const wrapper = component.find('.editable-element-actions');
        wrapper.simulate('click');
      });

      it('flags the element as removed', () => {
        expect(element.isRemoved()).to.equal(true);
      });
    });
  });
});
