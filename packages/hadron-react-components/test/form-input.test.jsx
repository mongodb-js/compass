import React from 'react';
import chai, { expect } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { FormInput } from '../';

chai.use(chaiEnzyme());

describe('<FormInput />', () => {
  describe('#render', () => {
    const changeHandler = sinon.spy();

    context('when no value is provided', () => {
      const component = shallow(
        <FormInput
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
        <FormInput
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
