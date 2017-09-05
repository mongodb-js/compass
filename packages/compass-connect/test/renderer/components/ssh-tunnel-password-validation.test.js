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
        ssh_tunnel_hostname: 'localhost',
        ssh_tunnel_port: 22,
        ssh_tunnel_username: 'user',
        ssh_tunnel_password: 'password'
      };
      const component = mount(
        <SSHTunnelPassword currentConnection={connection} isValid />
      );

      it('renders the wrapper div', () => {
        expect(component.find('.form-group')).to.be.present();
      });

      it('renders the hostname input', () => {
        expect(component.find('input[name="ssh_tunnel_hostname"]')).to.have.value('localhost');
      });

      it('renders the username input', () => {
        expect(component.find('input[name="ssh_tunnel_username"]')).to.have.value('user');
      });

      it('renders the password input', () => {
        expect(component.find('input[name="ssh_tunnel_password"]')).to.have.value('password');
      });
    });

    context('when the form is invalid', () => {
      context('when the hostname is empty', () => {
        const connection = {
          ssh_tunnel_port: 22,
          ssh_tunnel_username: 'user',
          ssh_tunnel_password: 'password'
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
          ssh_tunnel_hostname: 'localhost',
          ssh_tunnel_username: 'user',
          ssh_tunnel_password: 'password'
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
          ssh_tunnel_hostname: 'localhost',
          ssh_tunnel_port: 22,
          ssh_tunnel_password: 'password'
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
          ssh_tunnel_hostname: 'localhost',
          ssh_tunnel_port: 22,
          ssh_tunnel_username: 'user'
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
