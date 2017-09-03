const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const FormGroup = require('../../src/components/form/form-group');

chai.use(chaiEnzyme());

describe('<FormGroup />', () => {
  describe('#render', () => {
    const component = mount(
      <FormGroup id="testing" separator>
        <div id="child"></div>
      </FormGroup>
    );

    it('sets the id', () => {
      expect(component.find('#testing')).to.be.present();
    });

    it('adds the separator class name', () => {
      expect(component.find('.form-group-separator')).to.be.present();
    });

    it('renders the children', () => {
      expect(component.find('#child')).to.be.present();
    });
  });
});
