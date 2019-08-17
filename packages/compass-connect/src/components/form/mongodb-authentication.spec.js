import React from 'react';
import { mount } from 'enzyme';
import MongoDBAuthentication from './mongodb-authentication';

import styles from '../connect.less';

describe('MongoDBAuthentication [Component]', () => {
  context('when the form is valid', () => {
    const connection = {
      mongodbUsername: 'user',
      mongodbPassword: 'pass',
      mongodbDatabaseName: 'db'
    };
    let component;

    beforeEach(() => {
      component = mount(
        <MongoDBAuthentication currentConnection={connection} isValid />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the wrapper div', () => {
      expect(component.find(`.${styles['form-group']}`)).to.be.present();
    });

    it('renders the username input', () => {
      expect(component.find('input[name="username"]')).to.have.value('user');
    });

    it('renders the password input', () => {
      expect(component.find('input[name="password"]')).to.have.value('pass');
    });

    it('renders the auth source input', () => {
      expect(component.find('input[name="auth-source"]')).to.have.value('db');
    });

    it('renders the auth source placeholder', () => {
      expect(component.find('input[name="auth-source"]').prop('placeholder')).to.equal('admin');
    });
  });

  context('when the form is not valid', () => {
    context('when the username is empty', () => {
      const connection = { mongodbUsername: '', mongodbPassword: 'pass' };
      let component;

      beforeEach(() => {
        component = mount(
          <MongoDBAuthentication currentConnection={connection} />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the error input class', () => {
        const style = `.${styles['form-item-has-error']}`;

        expect(component.find(style)).to.be.present();
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
          <MongoDBAuthentication currentConnection={connection} />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the error input class', () => {
        const style = `.${styles['form-item-has-error']}`;

        expect(component.find(style)).to.be.present();
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
          <MongoDBAuthentication currentConnection={connection} />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the error input class', () => {
        const style = `.${styles['form-item-has-error']}`;

        expect(component.find(style)).to.be.present();
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
          <MongoDBAuthentication currentConnection={connection} />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the error input class', () => {
        const style = `.${styles['form-item-has-error']}`;

        expect(component.find(style)).to.be.present();
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
          <MongoDBAuthentication currentConnection={connection} />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the error input class', () => {
        const style = `.${styles['form-item-has-error']}`;

        expect(component.find(style)).to.be.present();
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
          <MongoDBAuthentication currentConnection={connection} />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the error input class', () => {
        const style = `.${styles['form-item-has-error']}`;

        expect(component.find(style)).to.be.present();
      });

      it('renders the error label class', () => {
        const error = component.find('FormInput[name="password"]').prop('error');

        expect(error).to.equal(true);
      });
    });
  });
});
