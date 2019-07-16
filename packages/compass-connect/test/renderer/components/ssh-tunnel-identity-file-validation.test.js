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
        sshTunnelHostname: 'localhost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'user',
        sshTunnelIdentityFile: ['path/to/file'],
        sshTunnelPassphrase: 'password'
      };
      const component = mount(
        <SSHTunnelIdentityFile currentConnection={connection} isValid />
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

      it('renders the file input', () => {
        expect(component.find('#sshTunnelIdentityFile').hostNodes()).to.have.text('file');
      });

      it('renders the passphrase input', () => {
        expect(component.find('input[name="sshTunnelPassphrase"]')).to.have.value('password');
      });

      it('renders the passphrase input as password field', () => {
        expect(component.find('input[name="sshTunnelPassphrase"]')).to.have.attr('type', 'password');
      });
    });

    context('when the form is invalid', () => {
      context('when the hostname is empty', () => {
        const connection = {
          sshTunnelPort: 22,
          sshTunnelUsername: 'user',
          sshTunnelIdentityFile: ['path/to/file'],
          sshTunnelPassphrase: 'password'
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
          sshTunnelHostname: 'localhost',
          sshTunnelUsername: 'user',
          sshTunnelIdentityFile: ['path/to/file'],
          sshTunnelPassphrase: 'password'
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
          sshTunnelHostname: 'localhost',
          sshTunnelPort: 22,
          sshTunnelIdentityFile: ['path/to/file'],
          sshTunnelPassphrase: 'password'
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
          sshTunnelHostname: 'localhost',
          sshTunnelPort: 22,
          sshTunnelUsername: 'user',
          sshTunnelPassphrase: 'password'
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
