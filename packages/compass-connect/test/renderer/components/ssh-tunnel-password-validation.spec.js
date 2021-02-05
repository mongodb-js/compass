import { mount } from 'enzyme';
import React from 'react';

import SSHTunnelPassword from '../../../src/components/form/ssh-tunnel-password-validation';

import styles from '../../../src/components/connect.less';

describe('SSHTunnelPassword [Component]', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        sshTunnelHostname: 'localhost',
        sshTunnelPort: 22,
        sshTunnelUsername: 'user',
        sshTunnelPassword: 'password'
      };
      let component;

      beforeEach(() => {
        component = mount(
          <SSHTunnelPassword connectionModel={connection} isValid />
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

      it('renders the sshTunnelPassword input', () => {
        const sshTunnelPasswordValue = component
          .find('input[name="sshTunnelPassword"]')
          .prop('value');

        expect(sshTunnelPasswordValue).to.equal('password');
      });
    });

    context('when the form is invalid', () => {
      context('when the sshTunnelHostname is empty', () => {
        const connection = {
          sshTunnelPort: 22,
          sshTunnelUsername: 'user',
          sshTunnelPassword: 'password'
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSHTunnelPassword connectionModel={connection} />
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
          sshTunnelPassword: 'password'
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSHTunnelPassword connectionModel={connection} />
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
          sshTunnelPassword: 'password'
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSHTunnelPassword connectionModel={connection} />
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

      context('when the sshTunnelPassword is empty', () => {
        const connection = {
          sshTunnelHostname: 'localhost',
          sshTunnelPort: 22,
          sshTunnelUsername: 'user'
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSHTunnelPassword connectionModel={connection} />
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
