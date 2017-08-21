const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const sinon = require('sinon');
const { shallow } = require('enzyme');
const FormFileInput = require('../../../src/components/form-file-input');

chai.use(chaiEnzyme());

describe('<FormFileInput />', () => {
  describe('#render', () => {
    context('when no values are provided', () => {
      const spy = sinon.spy();
      const component = shallow(
        <FormFileInput label="Test" name="testing" changeHandler={spy} />
      );

      it('renders the wrapper div', () => {
        expect(component.find('.form-item')).to.be.present();
      });

      it('renders the label', () => {
        expect(component.find('.form-item-label').text()).to.equal('Test');
      });

      it('renders the label button', () => {
        expect(component.find('.form-item-file-button').text()).to.equal('Select a file...');
      });

      it('renders the file icon', () => {
        expect(component.find('.fa-upload')).to.be.present();
      });
    });
  });
});
