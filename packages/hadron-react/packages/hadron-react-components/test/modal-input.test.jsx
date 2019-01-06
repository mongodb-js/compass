const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const sinon = require('sinon');
const { shallow } = require('enzyme');
const { ModalInput } = require('../');

chai.use(chaiEnzyme());

describe('<ModalInput />', () => {
  describe('#render', () => {
    const changeHandler = sinon.spy();
    const component = shallow(
      <ModalInput
        name="Test"
        id="testing"
        value="test"
        onChangeHandler={changeHandler} />
    );

    it('renders the value', () => {
      expect(component.find('#testing')).to.have.value('test');
    });

    it('renders the label name', () => {
      expect(component.find('p')).to.have.text('Test');
    });

    context('when changing the text', () => {
      it('calls the on change handler', () => {
        component.find('#testing').simulate('change', 'test');
        expect(changeHandler.calledWith('test')).to.equal(true);
      });
    });
  });
});
