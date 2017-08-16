const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const HostPortSection = require('../../src/components/host-port-section');

chai.use(chaiEnzyme());

describe('<HostPortSection />', () => {
  describe('#render', () => {
    const connection = {
      hostname: '127.0.0.1',
      port: '27018'
    };
    const component = mount(
      <HostPortSection currentConnection={connection} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.form-group')).to.be.present();
    });

    it('renders the hostname', () => {
      expect(component.find('input[name="hostname"]')).to.have.value('127.0.0.1');
    });

    it('renders the hostname placeholder', () => {
      expect(component.find('input[name="hostname"]').prop('placeholder')).to.equal('localhost');
    });

    it('renders the port', () => {
      expect(component.find('input[name="port"]')).to.have.value('27018');
    });

    it('renders the port placeholder', () => {
      expect(component.find('input[name="port"]').prop('placeholder')).to.equal('27017');
    });
  });
});
