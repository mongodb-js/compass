const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const SSHTunnelPassword = require('../../../lib/components/form/ssh-tunnel-password-validation');

chai.use(chaiEnzyme());

describe('<SSHTunnelPassword />', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        sshTunnelHostname: 'localhost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'user',
        sshTunnelPassword: 'password'
      };
      const component = mount(
        <SSHTunnelPassword currentConnection={connection} isValid />
      );

      it('renders the wrapper div', () => {
        expect(component.find('.form-group')).to.be.present();
      });

      it('renders the hostname input', () => {
        expect(component.find('input[name="sshTunnelHostname"]')).to.have.value('localhost');
      });

      it('renders the username input', () => {
        expect(component.find('input[name="sshTunnelUsername"]')).to.have.value('user');
      });

      it('renders the password input', () => {
        expect(component.find('input[name="sshTunnelPassword"]')).to.have.value('password');
      });
    });

    context('when the form is invalid', () => {
      context('when the hostname is empty', () => {
        const connection = {
          sshTunnelPort: 22,
          sshTunnelUsername: 'user',
          sshTunnelPassword: 'password'
        };
        const component = mount(
          <SSHTunnelPassword currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the port is empty', () => {
        const connection = {
          sshTunnelHostname: 'localhost',
          sshTunnelUsername: 'user',
          sshTunnelPassword: 'password'
        };
        const component = mount(
          <SSHTunnelPassword currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the username is empty', () => {
        const connection = {
          sshTunnelHostname: 'localhost',
          sshTunnelPort: 22,
          sshTunnelPassword: 'password'
        };
        const component = mount(
          <SSHTunnelPassword currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the password is empty', () => {
        const connection = {
          sshTunnelHostname: 'localhost',
          sshTunnelPort: 22,
          sshTunnelUsername: 'user'
        };
        const component = mount(
          <SSHTunnelPassword currentConnection={connection} />
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
