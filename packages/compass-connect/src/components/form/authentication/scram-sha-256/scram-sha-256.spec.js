import { mount } from 'enzyme';
import React from 'react';

import ScramSha256 from './scram-sha-256';
import styles from '../../../connect.less';

describe('ScramSha256 [Component]', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        mongodbUsername: 'user',
        mongodbPassword: 'pass',
        mongodbDatabaseName: 'db'
      };
      let component;

      beforeEach(() => {
        component = mount(
          <ScramSha256 connectionModel={connection} isValid />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the wrapper div', () => {
        expect(component.find(`.${styles['form-group']}`)).to.be.present();
      });

      it('renders the username input', () => {
        const usernameValue = component
          .find('input[name="username"]')
          .prop('value');

        expect(usernameValue).to.equal('user');
      });

      it('renders the password input', () => {
        const passwordValue = component
          .find('input[name="password"]')
          .prop('value');

        expect(passwordValue).to.equal('pass');
      });

      it('renders the authSource input', () => {
        const authSourceValue = component
          .find('input[name="authSource"]')
          .prop('value');

        expect(authSourceValue).to.equal('db');
      });

      it('renders the authSource placeholder', () => {
        const authSourcePlaceholder = component
          .find('input[name="authSource"]')
          .prop('placeholder');

        expect(authSourcePlaceholder).to.equal('admin');
      });
    });

    context('when the form is not valid', () => {
      context('when the username is empty', () => {
        const connection = { mongodbUsername: '', mongodbPassword: 'pass' };
        let component;

        beforeEach(() => {
          component = mount(<ScramSha256 connectionModel={connection} />);
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });

        it('renders the error label class', () => {
          const error = component.find('FormInput[name="username"]').prop('error');

          expect(error).to.equal(true);
        });
      });

      context('when the username is null', () => {
        const connection = { mongodbUsername: null, mongodbPassword: 'pass' };
        let component;

        beforeEach(() => {
          component = mount(
            <ScramSha256 connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });

        it('renders the error label class', () => {
          const error = component.find('FormInput[name="username"]').prop('error');

          expect(error).to.equal(true);
        });
      });

      context('when the username is undefined', () => {
        const connection = { mongodbPassword: 'pass' };
        let component;

        beforeEach(() => {
          component = mount(
            <ScramSha256 connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });

        it('renders the error label class', () => {
          const error = component.find('FormInput[name="username"]').prop('error');

          expect(error).to.equal(true);
        });
      });

      context('when the password is empty', () => {
        const connection = { mongodbPassword: '' };
        let component;

        beforeEach(() => {
          component = mount(
            <ScramSha256 connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });

        it('renders the error label class', () => {
          const error = component.find('FormInput[name="password"]').prop('error');

          expect(error).to.equal(true);
        });
      });

      context('when the password is null', () => {
        const connection = { mongodbPassword: null };
        let component;

        beforeEach(() => {
          component = mount(
            <ScramSha256 connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });

        it('renders the error label class', () => {
          const error = component.find('FormInput[name="password"]').prop('error');

          expect(error).to.equal(true);
        });
      });

      context('when the password is undefined', () => {
        const connection = { mongodbUsername: 'testing' };
        let component;

        beforeEach(() => {
          component = mount(
            <ScramSha256 connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });

        it('renders the error label class', () => {
          const error = component.find('FormInput[name="password"]').prop('error');

          expect(error).to.equal(true);
        });
      });
    });
  });
});
