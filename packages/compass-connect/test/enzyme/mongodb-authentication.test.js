const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const MongoDBAuthentication = require('../../lib/components/form/mongodb-authentication');

chai.use(chaiEnzyme());

describe('<MongoDBAuthentication />', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        mongodbUsername: 'user',
        mongodbPassword: 'pass',
        mongodbDatabaseName: 'db'
      };
      const component = mount(
        <MongoDBAuthentication currentConnection={connection} isValid />
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

    context('when the form is not valid', () => {
      context('when the username is empty', () => {
        const connection = {
          mongodbUsername: '',
          mongodbPassword: 'pass'
        };
        const component = mount(
          <MongoDBAuthentication currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });

        it('renders the error tooltip', () => {
          expect(component.find('input[name="username"]').prop('data-tip')).to.equal('Username is required');
        });
      });

      context('when the username is null', () => {
        const connection = {
          mongodbUsername: null,
          mongodbPassword: 'pass'
        };
        const component = mount(
          <MongoDBAuthentication currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });

        it('renders the error tooltip', () => {
          expect(component.find('input[name="username"]').prop('data-tip')).to.equal('Username is required');
        });
      });

      context('when the username is undefined', () => {
        const connection = {
          mongodbPassword: 'pass'
        };
        const component = mount(
          <MongoDBAuthentication currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });

        it('renders the error tooltip', () => {
          expect(component.find('input[name="username"]').prop('data-tip')).to.equal('Username is required');
        });
      });

      context('when the password is empty', () => {
        const connection = { mongodbPassword: '' };
        const component = mount(
          <MongoDBAuthentication currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });

        it('renders the error tooltip', () => {
          expect(component.find('input[name="password"]').prop('data-tip')).to.equal('Password is required');
        });
      });

      context('when the password is null', () => {
        const connection = { mongodbPassword: null };
        const component = mount(
          <MongoDBAuthentication currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });

        it('renders the error tooltip', () => {
          expect(component.find('input[name="password"]').prop('data-tip')).to.equal('Password is required');
        });
      });

      context('when the password is undefined', () => {
        const connection = { mongodbUsername: 'testing' };
        const component = mount(
          <MongoDBAuthentication currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });

        it('renders the error tooltip', () => {
          expect(component.find('input[name="password"]').prop('data-tip')).to.equal('Password is required');
        });
      });
    });
  });
});
