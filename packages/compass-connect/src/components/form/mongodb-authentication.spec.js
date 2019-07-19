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

      it('renders the error icon', () => {
        expect(component.find('.fa-exclamation-circle')).to.be.present();
      });

      it('renders the error class', () => {
        expect(component.find('.form-item-has-error')).to.be.present();
      });

      it('renders the error tooltip', () => {
        const error = component.find('input[name="username"]').prop('data-tip');

        expect(error).to.equal('Username is required');
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

      it('renders the error icon', () => {
        expect(component.find('.fa-exclamation-circle')).to.be.present();
      });

      it('renders the error class', () => {
        expect(component.find('.form-item-has-error')).to.be.present();
      });

      it('renders the error tooltip', () => {
        const error = component.find('input[name="username"]').prop('data-tip');

        expect(error).to.equal('Username is required');
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

      it('renders the error icon', () => {
        expect(component.find('.fa-exclamation-circle')).to.be.present();
      });

      it('renders the error class', () => {
        expect(component.find('.form-item-has-error')).to.be.present();
      });

      it('renders the error tooltip', () => {
        const error = component.find('input[name="username"]').prop('data-tip');

        expect(error).to.equal('Username is required');
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

      it('renders the error icon', () => {
        expect(component.find('.fa-exclamation-circle')).to.be.present();
      });

      it('renders the error class', () => {
        expect(component.find('.form-item-has-error')).to.be.present();
      });

      it('renders the error tooltip', () => {
        const error = component.find('input[name="password"]').prop('data-tip');

        expect(error).to.equal('Password is required');
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

      it('renders the error icon', () => {
        expect(component.find('.fa-exclamation-circle')).to.be.present();
      });

      it('renders the error class', () => {
        expect(component.find('.form-item-has-error')).to.be.present();
      });

      it('renders the error tooltip', () => {
        const error = component.find('input[name="password"]').prop('data-tip');

        expect(error).to.equal('Password is required');
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

      it('renders the error icon', () => {
        expect(component.find('.fa-exclamation-circle')).to.be.present();
      });

      it('renders the error class', () => {
        expect(component.find('.form-item-has-error')).to.be.present();
      });

      it('renders the error tooltip', () => {
        const error = component.find('input[name="password"]').prop('data-tip');

        expect(error).to.equal('Password is required');
      });
    });
  });
});
