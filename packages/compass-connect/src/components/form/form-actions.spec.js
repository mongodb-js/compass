import React from 'react';
import { mount } from 'enzyme';
import FormActions from './form-actions';

import styles from '../connect.less';

describe('FormActions [Component]', () => {
  context('when no error is present', () => {
    context('when is not connected', () => {
      context('when it is a connection string view', () => {
        context('when URI is editable and the connection is new', () => {
          const connection = { name: 'myconnection' };
          const isConnected = false;
          const viewType = 'connectionString';
          const isURIEditable = true;
          const isSavedConnection = false;
          let component;

          beforeEach(() => {
            component = mount(
              <FormActions
                currentConnection={connection}
                isConnected={isConnected}
                viewType={viewType}
                isURIEditable={isURIEditable}
                isSavedConnection={isSavedConnection}
                isValid
              />
            );
          });

          afterEach(() => {
            component = null;
          });

          it('renders the wrapper div', () => {
            expect(component.find(`.${styles['form-group']}`)).to.be.present();
          });

          it('does not render any message', () => {
            const classname = `.${styles['connection-message-container']}`;

            expect(component.find(classname)).to.be.blank();
          });

          it('renders the connect button', () => {
            expect(component.find('button[name="connect"]')).to.be.present();
          });

          it('does not render an edit button', () => {
            const editButton = component.find('button[name="editUrl"]');

            expect(editButton).to.be.not.present();
          });

          it('does not render a hide button', () => {
            const hideButton = component.find('button[name="hideUrl"]');

            expect(hideButton).to.be.not.present();
          });
        });

        context('when URI is editable and the connection is saved', () => {
          context('when URI was not changed', () => {
            const connection = { name: 'myconnection' };
            const isConnected = false;
            const viewType = 'connectionString';
            const isURIEditable = true;
            const isSavedConnection = true;
            const hasUnsavedChanges = false;
            let component;

            beforeEach(() => {
              component = mount(
                <FormActions
                  currentConnection={connection}
                  isConnected={isConnected}
                  viewType={viewType}
                  isURIEditable={isURIEditable}
                  isSavedConnection={isSavedConnection}
                  hasUnsavedChanges={hasUnsavedChanges}
                  isValid
                />
              );
            });

            afterEach(() => {
              component = null;
            });

            it('does not render an edit button', () => {
              const editButton = component.find('button[name="editUrl"]');

              expect(editButton).to.be.not.present();
            });

            it('renders a hide button', () => {
              const hideButton = component.find('button[name="hideUrl"]');

              expect(hideButton).to.be.present();
            });
          });

          context('when URI was changed', () => {
            const connection = { name: 'myconnection' };
            const isConnected = false;
            const viewType = 'connectionString';
            const isURIEditable = true;
            const isSavedConnection = true;
            const hasUnsavedChanges = true;
            let component;

            beforeEach(() => {
              component = mount(
                <FormActions
                  currentConnection={connection}
                  isConnected={isConnected}
                  viewType={viewType}
                  isURIEditable={isURIEditable}
                  isSavedConnection={isSavedConnection}
                  hasUnsavedChanges={hasUnsavedChanges}
                  isValid
                />
              );
            });

            afterEach(() => {
              component = null;
            });

            it('does not render an edit button', () => {
              const editButton = component.find('button[name="editUrl"]');

              expect(editButton).to.be.not.present();
            });

            it('does not render a hide button', () => {
              const hideButton = component.find('button[name="hideUrl"]');

              expect(hideButton).to.be.not.present();
            });
          });
        });

        context('when URI is not editable', () => {
          const connection = { name: 'myconnection' };
          const isConnected = false;
          const viewType = 'connectionString';
          const isURIEditable = false;
          let component;

          beforeEach(() => {
            component = mount(
              <FormActions
                currentConnection={connection}
                isConnected={isConnected}
                viewType={viewType}
                isURIEditable={isURIEditable}
                isValid
              />
            );
          });

          afterEach(() => {
            component = null;
          });

          it('renders an edit button', () => {
            const editButton = component.find('button[name="editUrl"]');

            expect(editButton).to.be.present();
          });
        });
      });

      context('when it is a connection form view', () => {
        const connection = { name: 'myconnection' };
        const isConnected = false;
        const viewType = 'connectionForm';
        const isURIEditable = true;
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              isURIEditable={isURIEditable}
              isValid
            />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the wrapper div', () => {
          expect(component.find(`.${styles['form-group']}`)).to.be.present();
        });

        it('does not render any message', () => {
          const classname = `.${styles['connection-message-container']}`;

          expect(component.find(classname)).to.be.blank();
        });

        it('renders the connect button', () => {
          expect(component.find('button[name="connect"]')).to.be.present();
        });

        it('does not render the edit button', () => {
          const editButton = component.find('button[name="editUrl"]');

          expect(editButton).to.be.not.present();
        });

        it('does not render the hide button', () => {
          const hideButton = component.find('button[name="hideUrl"]');

          expect(hideButton).to.be.not.present();
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
            isValid
          />
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
          errorMessage={errorMessage}
        />
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
            syntaxErrorMessage={syntaxErrorMessage}
          />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders a syntax error message', () => {
        const classname = `.${styles['connection-message-container-syntax-error']}`;

        expect(component.find(classname)).to.be.present();
      });

      it('disables the connect button', () => {
        const connectButton = component
          .find('button[name="connect"]')
          .simulate('click');

        expect(connectButton.hasClass('disabled')).to.equal(true);
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
            syntaxErrorMessage={syntaxErrorMessage}
          />
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
          syntaxErrorMessage={syntaxErrorMessage}
        />
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

  context('when a favorite was changed and not saved', () => {
    context('when there is no errors', () => {
      context('when it is a connection string view', () => {
        const connection = { name: 'myconnection', isFavorite: true };
        const isConnected = false;
        const viewType = 'connectionString';
        const errorMessage = null;
        const syntaxErrorMessage = null;
        const hasUnsavedChanges = true;
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              errorMessage={errorMessage}
              syntaxErrorMessage={syntaxErrorMessage}
              hasUnsavedChanges={hasUnsavedChanges}
              isValid
            />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders a favorite not saved warning', () => {
          const classname = `.${styles['connection-message-container-unsaved-message']}`;

          expect(component.find(classname)).to.be.present();
        });

        it('renders discard and save links', () => {
          const classname = `.${styles['connection-message-container-unsaved-message']}`;
          const message = component.find(classname);

          expect(message.find('a[id="discardChanges"]')).to.be.present();
          expect(message.find('a[id="saveChanges"]')).to.be.present();
        });
      });

      context('when it is a connection form view', () => {
        const connection = { name: 'myconnection' };
        const isConnected = false;
        const viewType = 'connectionForm';
        const errorMessage = null;
        const syntaxErrorMessage = null;
        const hasUnsavedChanges = true;
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              errorMessage={errorMessage}
              syntaxErrorMessage={syntaxErrorMessage}
              hasUnsavedChanges={hasUnsavedChanges}
              isValid
            />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders a favorite not saved warning', () => {
          const classname = `.${styles['connection-message-container-unsaved-message']}`;

          expect(component.find(classname)).to.be.present();
        });
      });
    });

    context('when a syntax error is present', () => {
      context('when it is a connection string view', () => {
        const connection = { name: 'myconnection' };
        const isConnected = false;
        const viewType = 'connectionString';
        const errorMessage = null;
        const syntaxErrorMessage = 'Syntax Error!';
        const hasUnsavedChanges = true;
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              errorMessage={errorMessage}
              syntaxErrorMessage={syntaxErrorMessage}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders a syntax error warning', () => {
          const classname = `.${styles['connection-message-container-syntax-error']}`;

          expect(component.find(classname)).to.be.present();
        });
      });

      context('when it is a connection form view', () => {
        const connection = { name: 'myconnection' };
        const isConnected = false;
        const viewType = 'connectionForm';
        const errorMessage = null;
        const syntaxErrorMessage = 'Syntax Error!';
        const hasUnsavedChanges = true;
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              errorMessage={errorMessage}
              syntaxErrorMessage={syntaxErrorMessage}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders a favorite not saved warning', () => {
          const classname = `.${styles['connection-message-container-unsaved-message']}`;

          expect(component.find(classname)).to.be.present();
        });
      });
    });

    context('when a server error is present', () => {
      context('when it is a connection string view', () => {
        const connection = { name: 'myconnection' };
        const isConnected = false;
        const viewType = 'connectionString';
        const errorMessage = 'Connection problem';
        const syntaxErrorMessage = null;
        const hasUnsavedChanges = true;
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              errorMessage={errorMessage}
              syntaxErrorMessage={syntaxErrorMessage}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders a server error warning', () => {
          const classname = `.${styles['connection-message-container-error']}`;

          expect(component.find(classname)).to.be.present();
        });
      });

      context('when it is a connection form view', () => {
        const connection = { name: 'myconnection' };
        const isConnected = false;
        const viewType = 'connectionForm';
        const errorMessage = 'Connection problem';
        const syntaxErrorMessage = null;
        const hasUnsavedChanges = true;
        let component;

        beforeEach(() => {
          component = mount(
            <FormActions
              currentConnection={connection}
              isConnected={isConnected}
              viewType={viewType}
              errorMessage={errorMessage}
              syntaxErrorMessage={syntaxErrorMessage}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders a server error warning', () => {
          const classname = `.${styles['connection-message-container-error']}`;

          expect(component.find(classname)).to.be.present();
        });
      });
    });
  });

  context('when a recent was changed and not saved', () => {
    const connection = { name: 'myconnection' };
    const isConnected = false;
    const viewType = 'connectionString';
    const errorMessage = null;
    const syntaxErrorMessage = null;
    const hasUnsavedChanges = true;
    let component;

    beforeEach(() => {
      component = mount(
        <FormActions
          currentConnection={connection}
          isConnected={isConnected}
          viewType={viewType}
          errorMessage={errorMessage}
          syntaxErrorMessage={syntaxErrorMessage}
          hasUnsavedChanges={hasUnsavedChanges}
          isValid
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders a recent not saved warning', () => {
      const classname = `.${styles['connection-message-container-unsaved-message']}`;

      expect(component.find(classname)).to.be.present();
    });

    it('renders only discard link', () => {
      const classname = `.${styles['connection-message-container-unsaved-message']}`;
      const message = component.find(classname);

      expect(message.find('a[id="discardChanges"]')).to.be.present();
      expect(message.find('a[id="saveChanges"]')).to.be.not.present();
    });
  });
});
