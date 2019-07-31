import React from 'react';
import { mount } from 'enzyme';
import FormActions from './form-actions';

import styles from '../connect.less';

describe('FormActions [Component]', () => {
  context('when no error is present', () => {
    context('when is not connected', () => {
      context('when it is a connection string view', () => {
        const connection = { name: 'myconnection' };
        const isConnected = false;
        const viewType = 'connectionString';
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              isValid />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the wrapper div', () => {
          expect(component.find(`.${styles['form-group']}`)).to.be.present();
        });

        it('renders the favoriteName input', () => {
          expect(component.find('input[name="favoriteName"]')).to.not.be.present();
        });

        it('does not render any message', () => {
          const classname = `.${styles['connection-message-container']}`;

          expect(component.find(classname)).to.be.blank();
        });

        it('renders the connect button', () => {
          expect(component.find('button[name="connect"]')).to.be.present();
        });

        it('does not render the create favorite button', () => {
          expect(component.find('button[name="createFavorite"]')).to.be.not.present();
        });
      });

      context('when it is a connection form view', () => {
        const connection = { name: 'myconnection' };
        const isConnected = false;
        const viewType = 'connectionForm';
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              isValid />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the wrapper div', () => {
          expect(component.find(`.${styles['form-group']}`)).to.be.present();
        });

        it('renders the favoriteName input', () => {
          const input = component.find('input[name="favoriteName"]');

          expect(input).to.have.value('myconnection');
        });

        it('does not render any message', () => {
          const classname = `.${styles['connection-message-container']}`;

          expect(component.find(classname)).to.be.blank();
        });

        it('renders the connect button', () => {
          expect(component.find('button[name="connect"]')).to.be.present();
        });

        it('does not render the create favorite button', () => {
          expect(component.find('button[name="createFavorite"]')).to.be.present();
        });
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

    it('renders an error message', () => {
      const classname = `.${styles['connection-message-container-error']}`;

      expect(component.find(classname)).to.be.present();
    });
  });

  context('when a syntax error is present', () => {
    context('when it is a connection string view', () => {
      const connection = { name: 'myconnection' };
      const isValid = false;
      const syntaxErrorMessage = 'Wrong syntax!';
      const viewType = 'connectionString';
      let component;

      beforeEach(() => {
        component = mount(
          <FormActions
            currentConnection={connection}
            isValid={isValid}
            viewType={viewType}
            syntaxErrorMessage={syntaxErrorMessage} />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders a syntax error message', () => {
        const classname = `.${styles['connection-message-container-syntax-error']}`;

        expect(component.find(classname)).to.be.present();
      });
    });

    context('when it is a connection form view', () => {
      const connection = { name: 'myconnection' };
      const isValid = false;
      const syntaxErrorMessage = 'Wrong syntax!';
      const viewType = 'connectionForm';
      let component;

      beforeEach(() => {
        component = mount(
          <FormActions
            currentConnection={connection}
            isValid={isValid}
            viewType={viewType}
            syntaxErrorMessage={syntaxErrorMessage} />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('does not render a syntax error message', () => {
        const classname = `.${styles['connection-message-container-syntax-error']}`;

        expect(component.find(classname)).to.be.not.present();
      });
    });
  });

  context('when a syntax error and server error are both present', () => {
    const connection = { name: 'myconnection' };
    const isValid = false;
    const errorMessage = 'Error message';
    const syntaxErrorMessage = 'Wrong syntax!';
    let component;

    beforeEach(() => {
      component = mount(
        <FormActions
          currentConnection={connection}
          isValid={isValid}
          errorMessage={errorMessage}
          syntaxErrorMessage={syntaxErrorMessage} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders only a server error message', () => {
      const classname = `.${styles['connection-message-container-error']}`;

      expect(component.find(classname)).to.be.present();
    });

    it('does not render a syntax error message', () => {
      const classname = `.${styles['connection-message-container-syntax-error']}`;

      expect(component.find(classname)).to.be.not.present();
    });
  });
});
