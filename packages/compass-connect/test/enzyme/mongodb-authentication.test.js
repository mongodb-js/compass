const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const MongoDBAuthentication = require('../../src/components/form/mongodb-authentication');

chai.use(chaiEnzyme());

describe('<MongoDBAuthentication />', () => {
  describe('#render', () => {
    const connection = {
      mongodb_username: 'user',
      mongodb_password: 'pass',
      mongodb_database_name: 'db'
    };
    const component = mount(
      <MongoDBAuthentication currentConnection={connection} />
    );

    it('renders the wrapper div', () => {
      expect(component.find('.form-group')).to.be.present();
    });

    it('renders the username input', () => {
      expect(component.find('input[name="username"]')).to.have.value('user');
    });

    it('renders the password input', () => {
      expect(component.find('input[name="password"]')).to.have.value('pass');
    });

    it('renders the auth source input', () => {
      expect(component.find('input[name="auth-source"]')).to.have.value('db');
    });

    it('renders the auth source placeholder', () => {
      expect(component.find('input[name="auth-source"]').prop('placeholder')).to.equal('admin');
    });
  });
});
