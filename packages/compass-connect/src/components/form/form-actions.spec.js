import React from 'react';
import { mount } from 'enzyme';
import FormActions from './form-actions';

import styles from '../connect.less';

describe('FormActions [Component]', () => {
  context('when no error is present', () => {
    context('when is not connected', () => {
      const connection = { name: 'myconnection' };
      const isConnected = false;
      let component;

      beforeEach(() => {
        component = mount(
          <FormActions
            currentConnection={connection}
            isConnected={isConnected}
            isValid />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the wrapper div', () => {
        expect(component.find(`.${styles['form-group']}`)).to.be.present();
      });

      it('renders the name', () => {
        const input = component.find('input[name="favoriteName"]');

        expect(input).to.have.value('myconnection');
      });

      it('does not render any message', () => {
        const classname = `.${styles['connection-message-container']}`;

        expect(component.find(classname)).to.be.blank();
      });
    });

    context('when is connected', () => {
      const connection = { name: 'myconnection' };
      const isConnected = true;
      let component;

      beforeEach(() => {
        component = mount(
          <FormActions
            currentConnection={connection}
            isConnected={isConnected}
            isValid />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders the wrapper div', () => {
        expect(component.find(`.${styles['form-group']}`)).to.be.present();
      });

      it('renders the success message', () => {
        const classname = `.${styles['connection-message-container-success']}`;

        expect(component.find(classname)).to.be.present();
      });
    });
  });

  context('when an error is present', () => {
    const connection = { name: 'myconnection' };
    const isValid = false;
    const errorMessage = 'Error message';
    let component;

    beforeEach(() => {
      component = mount(
        <FormActions
          currentConnection={connection}
          isValid={isValid}
          errorMessage={errorMessage} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the error message', () => {
      const classname = `.${styles['connection-message-container-error']}`;

      expect(component.find(classname)).to.be.present();
    });
  });
});
