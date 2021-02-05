import { mount } from 'enzyme';
import React from 'react';

import SSHTunnelIdentityFile from '../../../src/components/form/ssh-tunnel-identity-file-validation';

import styles from '../../../src/components/connect.less';

describe('SSHTunnelIdentityFile [Component]', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        sshTunnelHostname: 'localhost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'user',
        sshTunnelIdentityFile: ['path/to/file'],
        sshTunnelPassphrase: 'password'
      };
      let component;

      beforeEach(() => {
        component = mount(
          <SSHTunnelIdentityFile connectionModel={connection} isValid />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the wrapper div', () => {
        expect(component.find(`.${styles['form-group']}`)).to.exist;
      });

      it('renders the sshTunnelHostname input', () => {
        const sshTunnelHostnameValue = component
          .find('input[name="sshTunnelHostname"]')
          .prop('value');

        expect(sshTunnelHostnameValue).to.equal('localhost');
      });

      it('renders the sshTunnelUsername input', () => {
        const sshTunnelUsernameValue = component
          .find('input[name="sshTunnelUsername"]')
          .prop('value');

        expect(sshTunnelUsernameValue).to.equal('user');
      });

      it('renders the sshTunnelIdentityFile input', () => {
        const sshTunnelIdentityFileText = component
          .find('#sshTunnelIdentityFile')
          .hostNodes()
          .text();

        expect(sshTunnelIdentityFileText).to.equal('file');
      });

      it('renders the sshTunnelPassphrase input', () => {
        const sshTunnelPassphraseValue = component
          .find('input[name="sshTunnelPassphrase"]')
          .prop('value');

        expect(sshTunnelPassphraseValue).to.equal('password');
      });

      it('renders the sshTunnelPassphrase input as password field', () => {
        const sshTunnelPassphraseType = component
          .find('input[name="sshTunnelPassphrase"]')
          .prop('type');

        expect(sshTunnelPassphraseType).to.equal('password');
      });
    });

    context('when the form is invalid', () => {
      context('when the sshTunnelHostname is empty', () => {
        const connection = {
          sshTunnelPort: 22,
          sshTunnelUsername: 'user',
          sshTunnelIdentityFile: ['path/to/file'],
          sshTunnelPassphrase: 'password'
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSHTunnelIdentityFile connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.exist;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.exist;
        });
      });

      context('when the sshTunnelPort is empty', () => {
        const connection = {
          sshTunnelHostname: 'localhost',
          sshTunnelUsername: 'user',
          sshTunnelIdentityFile: ['path/to/file'],
          sshTunnelPassphrase: 'password'
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSHTunnelIdentityFile connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.exist;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.exist;
        });
      });

      context('when the sshTunnelUsername is empty', () => {
        const connection = {
          sshTunnelHostname: 'localhost',
          sshTunnelPort: 22,
          sshTunnelIdentityFile: ['path/to/file'],
          sshTunnelPassphrase: 'password'
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSHTunnelIdentityFile connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.exist;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.exist;
        });
      });

      context('when the sshTunnelIdentityFile is empty', () => {
        const connection = {
          sshTunnelHostname: 'localhost',
          sshTunnelPort: 22,
          sshTunnelUsername: 'user',
          sshTunnelPassphrase: 'password'
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSHTunnelIdentityFile connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.exist;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.exist;
        });
      });
    });
  });
});
