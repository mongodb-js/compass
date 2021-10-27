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
          .find('#ssl-server-validation button')
          .text();

        expect(fileButtonText).to.equal('file');
      });
    });
  });
});
