const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const FormActions = require('../../lib/components/form/form-actions');

chai.use(chaiEnzyme());

describe('<FormActions />', () => {
  describe('#render', () => {
    const connection = { name: 'myconnection' };
    const component = mount(
      <FormActions currentConnection={connection} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.form-group')).to.be.present();
    });

    it('renders the name', () => {
      expect(component.find('input[name="favoriteName"]')).to.have.value('myconnection');
    });
  });
});
