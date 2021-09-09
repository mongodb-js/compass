import { mount } from 'enzyme';
import React from 'react';

import SSLServerValidation from '../../../src/components/form/ssl-server-validation';

import styles from '../../../src/components/connect.module.less';

describe('SSLServerValidation [Component]', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = { sslCA: ['path/to/file'] };
      let component;

      beforeEach(() => {
        component = mount(
          <SSLServerValidation connectionModel={connection} isValid />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the wrapper div', () => {
        expect(component.find(`.${styles['form-group']}`)).to.be.present();
      });

      it('renders the file button', () => {
        const fileButtonText = component
          .find(`.${styles['form-item']} button`)
          .text();

        expect(fileButtonText).to.equal('file');
      });
    });

    context('when the form is invalid', () => {
      context('when the sslCA is empty', () => {
        const connection = { sslCA: [] };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });

      context('when the sslCA is null', () => {
        const connection = { sslCA: null };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });

      context('when the sslCA is undefined', () => {
        const connection = {};
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).to.be.present();
        });
      });
    });
  });
});
