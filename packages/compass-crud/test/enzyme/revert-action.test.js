const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const { Element } = require('hadron-document');
const RevertAction = require('../../src/components/revert-action');

chai.use(chaiEnzyme());

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
