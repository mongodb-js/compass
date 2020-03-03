import React from 'react';
import chai, { expect } from 'chai';
import chaiEnzyme from 'chai-enzyme';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { ModalCheckbox } from '../';

chai.use(chaiEnzyme());

describe('<ModalCheckbox />', () => {
  describe('#render', () => {
    const clickHandler = sinon.spy();
    const component = shallow(
      <ModalCheckbox
        name="testing"
        className="test-class"
        linkUrl="http://testing.com"
        checked={false}
        onClickHandler={clickHandler} />
    );

    it('renders the checkbox', () => {
      expect(component.find('input')).to.be.present();
    });

    it('renders the label name', () => {
      expect(component.find('p')).to.have.text('testing');
    });

    it('checks properly', () => {
      expect(component.find('input')).to.not.be.checked();
    });

    context('when clicking the checkbox', () => {
      it('calls the on click handler', () => {
        component.find('input').simulate('change');
        expect(clickHandler.calledOnce).to.equal(true);
      });
    });
  });
});
