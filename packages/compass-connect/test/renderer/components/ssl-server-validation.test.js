const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const SSLServerValidation = require('../../../src/components/form/ssl-server-validation');

chai.use(chaiEnzyme());

describe('<SSLServerValidation />', () => {
  describe('#render', () => {
    const connection = {
      ssl_ca: ['path/to/file']
    };
    const component = mount(
      <SSLServerValidation currentConnection={connection} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.form-group')).to.be.present();
    });

    it('renders the username input', () => {
      expect(component.find('.form-item-file-button')).to.have.text('file');
    });
  });
});
