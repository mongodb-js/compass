const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const sinon = require('sinon');
const { shallow } = require('enzyme');
const FormItemInput = require('../../src/components/form-item-input');

chai.use(chaiEnzyme());

describe('<FormItemInput />', () => {
  describe('#render', () => {
    const changeHandler = sinon.spy();

    context('when no value is provided', () => {
      const component = shallow(
        <FormItemInput
          label="Test"
          name="testing"
          placeholder="testme"
          changeHandler={changeHandler} />
      );

      it('renders the wrapper div', () => {
        expect(component.find('.form-item')).to.be.present();
      });

      it('renders the label', () => {
        expect(component.find('.form-item-label').text()).to.equal('Test');
      });

      it('renders the input name', () => {
        expect(component.find('.form-control').prop('name')).to.equal('testing');
      });

      it('renders the input placeholder', () => {
        expect(component.find('.form-control').prop('placeholder')).to.equal('testme');
      });

      it('renders an empty value', () => {
        expect(component.find('.form-control')).to.have.value(undefined);
      });
    });

    context('when a value is provided', () => {
      const component = shallow(
        <FormItemInput
          label="Test"
          name="testing"
          value="test"
          changeHandler={changeHandler} />
      );

      it('renders the value', () => {
        expect(component.find('.form-control')).to.have.value('test');
      });
    });
  });
});
