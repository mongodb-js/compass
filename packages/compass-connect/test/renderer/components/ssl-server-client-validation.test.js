const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const SSLServerClientValidation = require('../../../src/components/form/ssl-server-client-validation');

chai.use(chaiEnzyme());

describe('<SSLServerClientValidation />', () => {
  describe('#render', () => {
    const connection = {
      ssl_ca: ['path/to/ca'],
      ssl_certificate: ['path/to/cert'],
      ssl_private_key: ['path/to/key'],
      ssl_private_key_password: 'testing'
    };
    const component = mount(
      <SSLServerClientValidation currentConnection={connection} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.form-group')).to.be.present();
    });

    it('renders the ssl ca button', () => {
      expect(component.find('#ssl_ca')).to.have.text('ca');
    });

    it('renders the ssl certificate button', () => {
      expect(component.find('#ssl_certificate')).to.have.text('cert');
    });

    it('renders the ssl private key button', () => {
      expect(component.find('#ssl_private_key')).to.have.text('key');
    });

    it('renders the ssl private key password', () => {
      expect(component.find('input[name="ssl_private_key_password"]')).to.have.value('testing');
    });
  });
});
