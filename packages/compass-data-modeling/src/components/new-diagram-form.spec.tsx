import React from 'react';
import { expect } from 'chai';
import {
  screen,
  userEvent,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import NewDiagramForm from './new-diagram-form';
import { changeName, createNewDiagram } from '../store/generate-diagram-wizard';
import { renderWithStore } from '../../test/setup-store';
import type { DataModelingStore } from '../../test/setup-store';

describe('NewDiagramForm', function () {
  context('enter-name step', function () {
    let store: DataModelingStore;
    let modal: HTMLElement;

    beforeEach(() => {
      const { store: setupStore } = renderWithStore(<NewDiagramForm />);
      store = setupStore;
      store.dispatch(createNewDiagram());
      modal = screen.getByTestId('new-diagram-modal');
      expect(modal).to.be.visible;
    });

    it('allows user to enter name for the model', function () {
      userEvent.type(
        within(modal).getByTestId('new-diagram-name-input'),
        'diagram-1'
      );
      expect(store.getState().generateDiagramWizard.diagramName).to.equal(
        'diagram-1'
      );
    });

    it('keeps next button disabled if diagram name is empty', function () {
      userEvent.clear(within(modal).getByTestId('new-diagram-name-input'));
      expect(store.getState().generateDiagramWizard.diagramName).to.equal('');
      const button = within(modal).getByRole('button', {
        name: /next/i,
      });
      expect(button.getAttribute('aria-disabled')).to.equal('true');
    });

    it('cancels process when cancel is clicked', function () {
      userEvent.click(
        within(modal).getByRole('button', {
          name: /cancel/i,
        })
      );
      expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
    });
  });

  context('select-connection step', function () {
    it('shows warning if there are no connections', function () {
      const { store } = renderWithStore(<NewDiagramForm />, {
        connections: [],
      });
      store.dispatch(createNewDiagram());

      store.dispatch(changeName('diagram1'));
      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      const alert = screen.getByRole('alert');
      expect(alert.textContent).to.contain(
        'You do not have any connections, create a new connection first'
      );
    });

    it('shows list of connections and allows user to select one', async function () {
      const { store } = renderWithStore(<NewDiagramForm />);

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
      expect(screen.getByText('Conn1')).to.exist;
      expect(screen.getByText('Conn2')).to.exist;

      userEvent.click(screen.getByText('Conn2'));
      expect(store.getState().generateDiagramWizard.selectedConnectionId).to.eq(
        'two'
      );

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'CONNECTING'
      );
      await waitFor(() => {
        expect(
          store.getState().generateDiagramWizard.connectionDatabases
        ).to.deep.equal(['berlin', 'sample_airbnb']);
      });

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'SELECT_DATABASE'
      );
    });

    it('shows error if it fails to connect', async function () {
      const { store } = renderWithStore(<NewDiagramForm />, {
        services: {
          connections: {
            connect() {
              throw new Error('Can not connect');
            },
            getConnectionById(id: string) {
              return {
                info: { id },
              };
            },
          } as any,
        },
      });

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
      userEvent.click(screen.getByText('Conn2'));
      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      await waitFor(() => {
        expect(store.getState().generateDiagramWizard.step).to.equal(
          'SELECT_CONNECTION'
        );
      });

      expect(screen.getByText(/select connection/i)).to.exist;
      expect(store.getState().generateDiagramWizard.error?.message).to.equal(
        'Can not connect'
      );
      const alert = screen.getByRole('alert');
      expect(alert.textContent).to.contain('Can not connect');
    });
  });

  context('select-database step', function () {
    it('shows list of databases and allows user to select one', async function () {
      const { store } = renderWithStore(<NewDiagramForm />);

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      {
        // Navigate to select db
        userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
        await waitFor(() => {
          expect(store.getState().generateDiagramWizard.step).to.equal(
            'SELECT_DATABASE'
          );
        });
      }

      userEvent.click(screen.getByTestId('new-diagram-database-selector'));
      expect(screen.getByText('berlin')).to.exist;
      expect(screen.getByText('sample_airbnb')).to.exist;

      userEvent.click(screen.getByText('sample_airbnb'));
      expect(store.getState().generateDiagramWizard.selectedDatabase).to.eq(
        'sample_airbnb'
      );

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'LOADING_COLLECTIONS'
      );
      await waitFor(() => {
        expect(
          store.getState().generateDiagramWizard.selectedCollections
        ).to.deep.equal(['listings', 'listingsAndReviews', 'reviews']);
      });

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'SELECT_COLLECTIONS'
      );
    });

    it('shows error if it fails to fetch list of databases', async function () {
      const { store } = renderWithStore(<NewDiagramForm />, {
        services: {
          connections: {
            connect() {
              return Promise.resolve();
            },
            getConnectionById(id: string) {
              return {
                info: { id },
              };
            },
            getDataServiceForConnection() {
              return {
                listDatabases() {
                  throw new Error('Can not list databases');
                },
              };
            },
          } as any,
        },
      });

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
      userEvent.click(screen.getByText('Conn2'));
      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      await waitFor(() => {
        expect(store.getState().generateDiagramWizard.step).to.equal(
          'SELECT_CONNECTION'
        );
      });

      expect(screen.getByText(/select connection/i)).to.exist;
      expect(store.getState().generateDiagramWizard.error?.message).to.equal(
        'Can not list databases'
      );
      const alert = screen.getByRole('alert');
      expect(alert.textContent).to.contain('Can not list databases');
    });
  });

  context('select-collections step', function () {
    it('shows list of collections', async function () {
      const { store } = renderWithStore(<NewDiagramForm />);

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      {
        // Navigate to select db
        userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
        await waitFor(() => {
          expect(store.getState().generateDiagramWizard.step).to.equal(
            'SELECT_DATABASE'
          );
        });
      }

      {
        // Navigate to select colls
        userEvent.click(screen.getByTestId('new-diagram-database-selector'));
        userEvent.click(screen.getByText('sample_airbnb'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
        await waitFor(() => {
          expect(store.getState().generateDiagramWizard.step).to.equal(
            'SELECT_COLLECTIONS'
          );
        });
      }

      expect(screen.getByText('listings')).to.exist;
      expect(screen.getByText('listingsAndReviews')).to.exist;
      expect(screen.getByText('reviews')).to.exist;

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'SELECT_COLLECTIONS'
      );
      expect(
        store.getState().generateDiagramWizard.selectedCollections
      ).to.deep.equal(['listings', 'listingsAndReviews', 'reviews']);

      userEvent.click(
        screen.getByRole('button', {
          name: /generate/i,
        })
      );

      await waitFor(() => {
        expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
      });
    });

    it('shows error if it fails to fetch list of collections', async function () {
      const { store } = renderWithStore(<NewDiagramForm />, {
        services: {
          connections: {
            connect() {
              return Promise.resolve();
            },
            getConnectionById(id: string) {
              return {
                info: { id },
              };
            },
            getDataServiceForConnection() {
              return {
                listDatabases() {
                  return [
                    {
                      _id: 'sample_airbnb',
                      name: 'sample_airbnb',
                    },
                  ];
                },
                listCollections() {
                  throw new Error('Can not list collections');
                },
              };
            },
          } as any,
        },
      });

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      {
        // Navigate to databases list
        userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
        await waitFor(() => {
          expect(store.getState().generateDiagramWizard.step).to.equal(
            'SELECT_DATABASE'
          );
        });
      }

      {
        // Navigate to collections
        userEvent.click(screen.getByTestId('new-diagram-database-selector'));
        userEvent.click(screen.getByText('sample_airbnb'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
        // When it fails to load collections, we are back at SELECT_DATABASE
        await waitFor(() => {
          expect(store.getState().generateDiagramWizard.step).to.equal(
            'SELECT_DATABASE'
          );
        });
      }

      expect(screen.getByText(/select database/i)).to.exist;
      expect(store.getState().generateDiagramWizard.error?.message).to.equal(
        'Can not list collections'
      );
      const alert = screen.getByRole('alert');
      expect(alert.textContent).to.contain('Can not list collections');
    });
  });
});
