const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const sinon = require('sinon');
const { mount } = require('enzyme');
const FormItemSelect = require('../../src/components/form-item-select');

chai.use(chaiEnzyme());

describe('<FormItemSelect />', () => {
  describe('#render', () => {
    const spy = sinon.spy();
    const changeHandler = (evt) => {
      spy(evt.target.value);
    };
    const component = mount(
      <FormItemSelect
        label="Test"
        name="testing"
        changeHandler={changeHandler}
        options={[{'mongodb': 'MongoDB'}]} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.form-item')).to.be.present();
    });

    it('renders the label', () => {
      expect(component.find('.form-item-label').text()).to.equal('Test');
    });

    it('renders the selection name', () => {
      expect(component.find('.form-control').prop('name')).to.equal('testing');
    });

    it('renders the select options', () => {
      expect(component.find('.form-control option').text()).to.equal('MongoDB');
    });

    context('when selecting an option', () => {
      before(() => {
        component.find('select').simulate('change');
      });

      it('calls the provided change handler with the data', () => {
        expect(spy.withArgs('mongodb').calledOnce).to.equal(true);
      });
    });
  });
});
