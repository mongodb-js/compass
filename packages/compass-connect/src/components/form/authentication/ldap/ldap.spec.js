import React from 'react';
import { mount } from 'enzyme';

import LDAP from './ldap';
import FormGroup from '../../form-group';
import styles from '../../../connect.less';

describe('<LDAP />', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        ldapUsername: 'username',
        ldapPassword: 'password'
      };
      const component = mount(
        <LDAP currentConnection={connection} isValid />
      );

      it('renders the wrapper div', () => {
        expect(component.find(FormGroup)).to.be.present();
      });

      it('renders the username input', () => {
        expect(component.find('input[name="ldap-username"]')).to.be.present();
      });

      it('renders the password input', () => {
        expect(component.find('input[name="ldap-password"]')).to.be.present();
      });
    });

    context('when the form is not valid', () => {
      context('when the username is empty', () => {
        const connection = {
          ldapUsername: '',
          ldapPassword: 'password'
        };
        const component = mount(
          <LDAP currentConnection={connection} />
        );

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });

      context('when the username is null', () => {
        const connection = {
          ldapUsername: null,
          ldapPassword: 'password'
        };
        const component = mount(
          <LDAP currentConnection={connection} />
        );

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });

      context('when the username is undefined', () => {
        const connection = {
          ldapPassword: 'password'
        };
        const component = mount(
          <LDAP currentConnection={connection} />
        );

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });

      context('when the password is empty', () => {
        const connection = {
          ldapUsername: 'username',
          ldapPassword: ''
        };
        const component = mount(
          <LDAP currentConnection={connection} />
        );

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });

      context('when the password is null', () => {
        const connection = {
          ldapUsername: 'username',
          ldapPassword: null
        };
        const component = mount(
          <LDAP currentConnection={connection} />
        );

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });

      context('when the password is undefined', () => {
        const connection = {
          ldapUsername: 'username'
        };
        const component = mount(
          <LDAP currentConnection={connection} />
        );

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });
    });
  });
});
