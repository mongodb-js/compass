const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const { Element } = require('hadron-document');
const RemoveAction = require('../../src/components/remove-action');

chai.use(chaiEnzyme());

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
