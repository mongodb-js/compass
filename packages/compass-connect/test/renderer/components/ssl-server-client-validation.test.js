const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const SSLServerClientValidation = require('../../../lib/components/form/ssl-server-client-validation');

chai.use(chaiEnzyme());

describe('<SSLServerClientValidation />', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        ssl_ca: ['path/to/ca'],
        ssl_certificate: ['path/to/cert'],
        ssl_private_key: ['path/to/key'],
        ssl_private_key_password: 'testing'
      };
      const component = mount(
        <SSLServerClientValidation currentConnection={connection} isValid />
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

    context('when the form is invalid', () => {
      context('when the ssl ca is empty', () => {
        const connection = {
          ssl_ca: [],
          ssl_certificate: ['path/to/cert'],
          ssl_private_key: ['path/to/key']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl ca is null', () => {
        const connection = {
          ssl_ca: null,
          ssl_certificate: ['path/to/cert'],
          ssl_private_key: ['path/to/key']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl ca is undefined', () => {
        const connection = {
          ssl_certificate: ['path/to/cert'],
          ssl_private_key: ['path/to/key']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl certificate is empty', () => {
        const connection = {
          ssl_ca: ['path/to/ca'],
          ssl_certificate: [],
          ssl_private_key: ['path/to/key']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl certificate is null', () => {
        const connection = {
          ssl_ca: ['path/to/ca'],
          ssl_certificate: null,
          ssl_private_key: ['path/to/key']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl certificate is undefined', () => {
        const connection = {
          ssl_ca: ['path/to/ca'],
          ssl_private_key: ['path/to/key']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl private key is empty', () => {
        const connection = {
          ssl_ca: ['path/to/ca'],
          ssl_private_key: [],
          ssl_certificate: ['path/to/cert']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl private key is null', () => {
        const connection = {
          ssl_ca: ['path/to/ca'],
          ssl_private_key: null,
          ssl_certificate: ['path/to/cert']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl private key is undefined', () => {
        const connection = {
          ssl_ca: ['path/to/ca'],
          ssl_certificate: ['path/to/cert']
        };
        const component = mount(
          <SSLServerClientValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });
    });
  });
});
