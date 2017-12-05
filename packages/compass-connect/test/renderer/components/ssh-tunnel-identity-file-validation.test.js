const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { mount } = require('enzyme');
const SSHTunnelIdentityFile = require('../../../lib/components/form/ssh-tunnel-identity-file-validation');

chai.use(chaiEnzyme());

describe('<SSHTunnelIdentityFile />', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        ssh_tunnel_hostname: 'localhost',
        ssh_tunnel_port: 22,
        ssh_tunnel_username: 'user',
        ssh_tunnel_identity_file: ['path/to/file'],
        ssh_tunnel_passphrase: 'password'
      };
      const component = mount(
        <SSHTunnelIdentityFile currentConnection={connection} isValid />
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

      it('renders the file input', () => {
        expect(component.find('#ssh_tunnel_identity_file')).to.have.text('file');
      });

      it('renders the passphrase input', () => {
        expect(component.find('input[name="ssh_tunnel_passphrase"]')).to.have.value('password');
      });

      it('renders the passphrase input as password field', () => {
        expect(component.find('input[name="ssh_tunnel_passphrase"]')).to.have.attr('type', 'password');
      });
    });

    context('when the form is invalid', () => {
      context('when the hostname is empty', () => {
        const connection = {
          ssh_tunnel_port: 22,
          ssh_tunnel_username: 'user',
          ssh_tunnel_identity_file: ['path/to/file'],
          ssh_tunnel_passphrase: 'password'
        };
        const component = mount(
          <SSHTunnelIdentityFile currentConnection={connection} />
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
          ssh_tunnel_identity_file: ['path/to/file'],
          ssh_tunnel_passphrase: 'password'
        };
        const component = mount(
          <SSHTunnelIdentityFile currentConnection={connection} />
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
          ssh_tunnel_identity_file: ['path/to/file'],
          ssh_tunnel_passphrase: 'password'
        };
        const component = mount(
          <SSHTunnelIdentityFile currentConnection={connection} />
        );

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the error class', () => {
          expect(component.find('.form-item-has-error')).to.be.present();
        });
      });

      context('when the file is empty', () => {
        const connection = {
          ssh_tunnel_hostname: 'localhost',
          ssh_tunnel_port: 22,
          ssh_tunnel_username: 'user',
          ssh_tunnel_passphrase: 'password'
        };
        const component = mount(
          <SSHTunnelIdentityFile currentConnection={connection} />
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
