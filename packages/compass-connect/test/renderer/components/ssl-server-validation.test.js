const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const SSLServerValidation = require('../../../src/components/form/ssl-server-validation');

chai.use(chaiEnzyme());

describe('<SSLServerValidation />', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        ssl_ca: ['path/to/file']
      };
      const component = mount(
        <SSLServerValidation currentConnection={connection} isValid />
      );

      it('renders the wrapper div', () => {
        expect(component.find('.form-group')).to.be.present();
      });

      it('renders the username input', () => {
        expect(component.find('.form-item-file-button')).to.have.text('file');
      });
    });

    context('when the form is invalid', () => {
      context('when the ssl ca is empty', () => {
        const connection = {
          ssl_ca: []
        };
        const component = mount(
          <SSLServerValidation currentConnection={connection} />
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
          ssl_ca: null
        };
        const component = mount(
          <SSLServerValidation currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the ssl ca is undefined', () => {
        const connection = {};
        const component = mount(
          <SSLServerValidation currentConnection={connection} />
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
