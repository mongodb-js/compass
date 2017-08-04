const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const { Element } = require('hadron-document');
const ElementAction = require('../../src/components/element-action');

chai.use(chaiEnzyme());

describe('<ElementAction />', () => {
  const parentElement = new Element('parent', 'testing', false);

  describe('#render', () => {
    context('when the element is revertable', () => {
      const element = new Element('name', 'test', false, parentElement);
      element.edit('testing');
      const component = mount(<ElementAction element={element} />);

      it('renders the revert action component', () => {
        const wrapper = component.find('.editable-element-actions');
        expect(wrapper).to.contain(<i className="fa fa-rotate-left" aria-hidden />);
      });
    });

    context('when the element is removable', () => {
      const element = new Element('name', 'test', false, parentElement);
      const component = mount(<ElementAction element={element} />);

      it('renders the remove action component', () => {
        const wrapper = component.find('.editable-element-actions');
        expect(wrapper).to.contain(<i className="fa fa-times-circle" aria-hidden />);
      });
    });

    context('when the element is not actionable', () => {
      const element = new Element('_id', 'test', false, parentElement);
      const component = mount(<ElementAction element={element} />);

      it('renders the no action component', () => {
        const wrapper = component.find('.editable-element-actions');
        expect(wrapper).to.be.blank();
      });
    });
  });
});
