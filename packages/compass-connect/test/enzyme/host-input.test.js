const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const HostInput = require('../../lib/components/form/host-input');

chai.use(chaiEnzyme());

describe('<HostInput />', () => {
  describe('#render', () => {
    const component = mount(
      <HostInput hostname="127.0.0.1"/>
    );

    it('renders the hostname', () => {
      expect(component.find('input[name="hostname"]')).to.have.value('127.0.0.1');
    });

    it('renders the hostname placeholder', () => {
      expect(component.find('input[name="hostname"]').prop('placeholder')).to.equal('localhost');
    });
  });
});
