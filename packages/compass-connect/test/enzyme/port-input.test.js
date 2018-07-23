const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const PortInput = require('../../lib/components/form/port-input');

chai.use(chaiEnzyme());

describe('<PortInput />', () => {
  describe('#render', () => {
    const component = mount(
      <PortInput port="27018" />
    );

    it('renders the port', () => {
      expect(component.find('input[name="port"]')).to.have.value('27018');
    });

    it('renders the port placeholder', () => {
      expect(component.find('input[name="port"]').prop('placeholder')).to.equal('27017');
    });
  });
});
