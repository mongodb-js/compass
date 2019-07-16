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
        sslCA: ['path/to/ca'],
        sslCert: ['path/to/cert'],
        sslKey: ['path/to/key'],
        sslPass: 'testing'
      };
      const component = mount(
        <SSLServerClientValidation currentConnection={connection} isValid />
      );

      it('renders the wrapper div', () => {
        expect(component.find('.form-group')).to.be.present();
      });

      it('renders the ssl ca button', () => {
        expect(component.find('#sslCA').hostNodes()).to.have.text('ca');
      });

      it('renders the ssl certificate button', () => {
        expect(component.find('#sslCert').hostNodes()).to.have.text('cert');
      });

      it('renders the ssl private key button', () => {
        expect(component.find('#sslKey').hostNodes()).to.have.text('key');
      });

      it('renders the ssl private key password', () => {
        expect(component.find('input[name="sslPass"]')).to.have.value('testing');
      });
    });

    context('when the form is invalid', () => {
      context('when the ssl ca is empty', () => {
        const connection = {
          sslCA: [],
          sslCert: ['path/to/cert'],
          sslKey: ['path/to/key']
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
          sslCA: null,
          sslCert: ['path/to/cert'],
          sslKey: ['path/to/key']
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
          sslCert: ['path/to/cert'],
          sslKey: ['path/to/key']
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
          sslCA: ['path/to/ca'],
          sslCert: [],
          sslKey: ['path/to/key']
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
          sslCA: ['path/to/ca'],
          sslCert: null,
          sslKey: ['path/to/key']
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
          sslCA: ['path/to/ca'],
          sslKey: ['path/to/key']
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
          sslCA: ['path/to/ca'],
          sslKey: [],
          sslCert: ['path/to/cert']
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
          sslCA: ['path/to/ca'],
          sslKey: null,
          sslCert: ['path/to/cert']
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
          sslCA: ['path/to/ca'],
          sslCert: ['path/to/cert']
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
