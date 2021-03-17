import { mount } from 'enzyme';
import React from 'react';

import SSLServerClientValidation from '../../../src/components/form/ssl-server-client-validation';

import styles from '../../../src/components/connect.less';

describe('SSLServerClientValidation [Component]', () => {
  describe('#render', () => {
    context('when the form is valid', () => {
      const connection = {
        sslCA: ['path/to/ca'],
        sslCert: ['path/to/cert'],
        sslKey: ['path/to/key'],
        sslPass: 'testing'
      };
      let component;

      beforeEach(() => {
        component = mount(
          <SSLServerClientValidation connectionModel={connection} isValid />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the wrapper div', () => {
        expect(component.find(`.${styles['form-group']}`)).be.present();
      });

      it('renders the sslCA button', () => {
        const sslCAText = component
          .find('#sslCA')
          .hostNodes()
          .text();

        expect(sslCAText).to.equal('ca');
      });

      it('renders the sslCert button', () => {
        const sslCAText = component
          .find('#sslCert')
          .hostNodes()
          .text();

        expect(sslCAText).to.equal('cert');
      });

      it('renders the sslKey button', () => {
        const sslCAText = component
          .find('#sslKey')
          .hostNodes()
          .text();

        expect(sslCAText).to.equal('key');
      });

      it('renders the sslPass input', () => {
        const sshTunnelUsernameValue = component
          .find('input[name="sslPass"]')
          .prop('value');

        expect(sshTunnelUsernameValue).to.equal('testing');
      });
    });

    context('when the form is invalid', () => {
      context('when the sslCA is empty', () => {
        const connection = {
          sslCA: [],
          sslCert: ['path/to/cert'],
          sslKey: ['path/to/key']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });

      context('when the sslCA is null', () => {
        const connection = {
          sslCA: null,
          sslCert: ['path/to/cert'],
          sslKey: ['path/to/key']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });

      context('when the sslCA is undefined', () => {
        const connection = {
          sslCert: ['path/to/cert'],
          sslKey: ['path/to/key']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });

      context('when the sslCert is empty', () => {
        const connection = {
          sslCA: ['path/to/ca'],
          sslCert: [],
          sslKey: ['path/to/key']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });

      context('when the sslCert is null', () => {
        const connection = {
          sslCA: ['path/to/ca'],
          sslCert: null,
          sslKey: ['path/to/key']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });

      context('when the sslCert is undefined', () => {
        const connection = {
          sslCA: ['path/to/ca'],
          sslKey: ['path/to/key']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });

      context('when the sslKey is empty', () => {
        const connection = {
          sslCA: ['path/to/ca'],
          sslKey: [],
          sslCert: ['path/to/cert']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });

      context('when the sslKey is null', () => {
        const connection = {
          sslCA: ['path/to/ca'],
          sslKey: null,
          sslCert: ['path/to/cert']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });

      context('when the sslKey is undefined', () => {
        const connection = {
          sslCA: ['path/to/ca'],
          sslCert: ['path/to/cert']
        };
        let component;

        beforeEach(() => {
          component = mount(
            <SSLServerClientValidation connectionModel={connection} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the error class', () => {
          expect(component.find(`.${styles['form-item-has-error']}`)).be.present();
        });
      });
    });
  });
});
